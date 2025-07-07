#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Input validation schemas
const FileReadArgsSchema = z.object({
  path: z.string().min(1, "Path cannot be empty"),
});

const FileWriteArgsSchema = z.object({
  path: z.string().min(1, "Path cannot be empty"),
  content: z.string(),
});

const ListDirectoryArgsSchema = z.object({
  path: z.string().min(1, "Path cannot be empty"),
});

// Server configuration
const SERVER_CONFIG = {
  name: "fe-mcp",
  version: "1.0.0",
  description: "A basic MCP server with file operations and system information",
  author: "MCP Developer",
  license: "MIT",
};

class BasicMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "file_read",
            description: "Read the contents of a file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to the file to read",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "file_write",
            description: "Write content to a file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to the file to write",
                },
                content: {
                  type: "string",
                  description: "Content to write to the file",
                },
              },
              required: ["path", "content"],
            },
          },
          {
            name: "list_directory",
            description: "List the contents of a directory",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to the directory to list",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "system_info",
            description: "Get system information",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "file_read":
            return await this.handleFileRead(args);
          case "file_write":
            return await this.handleFileWrite(args);
          case "list_directory":
            return await this.handleListDirectory(args);
          case "system_info":
            return await this.handleSystemInfo();
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "config://server",
            name: "Server Configuration",
            description: "Current server configuration and metadata",
            mimeType: "application/json",
          },
          {
            uri: "status://system",
            name: "System Status",
            description: "Current system status and information",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case "config://server":
            return {
              contents: [
                {
                  uri: uri,
                  mimeType: "application/json",
                  text: JSON.stringify(SERVER_CONFIG, null, 2),
                },
              ],
            };
          case "status://system":
            return {
              contents: [
                {
                  uri: uri,
                  mimeType: "application/json",
                  text: JSON.stringify(
                    {
                      hostname: os.hostname(),
                      platform: os.platform(),
                      arch: os.arch(),
                      uptime: os.uptime(),
                      loadavg: os.loadavg(),
                      totalmem: os.totalmem(),
                      freemem: os.freemem(),
                      cpus: os.cpus().length,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Unknown resource: ${uri}`
            );
        }
      }
    );
  }

  private async handleFileRead(args: unknown) {
    const { path } = FileReadArgsSchema.parse(args);

    try {
      const content = await fs.readFile(path, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async handleFileWrite(args: unknown) {
    const { path, content } = FileWriteArgsSchema.parse(args);

    try {
      await fs.writeFile(path, content, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `Successfully wrote ${content.length} characters to ${path}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to write file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async handleListDirectory(args: unknown) {
    const { path } = ListDirectoryArgsSchema.parse(args);

    try {
      const items = await fs.readdir(path, { withFileTypes: true });
      const contents = items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
        path: join(path, item.name),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(contents, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list directory: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async handleSystemInfo() {
    const info = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().map((cpu) => ({
        model: cpu.model,
        speed: cpu.speed,
      })),
      networkInterfaces: Object.keys(os.networkInterfaces()),
      userInfo: os.userInfo(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log server startup (to stderr so it doesn't interfere with stdio transport)
    console.error(`${SERVER_CONFIG.name} v${SERVER_CONFIG.version} started`);
  }
}

// Start the server
const server = new BasicMCPServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
