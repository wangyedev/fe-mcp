# Basic MCP Server

A simple Model Context Protocol (MCP) server implementation in TypeScript that provides basic tools and resources for AI applications.

## Features

- **Tools**: File operations, system information
- **Resources**: Configuration files, system status
- **Transport**: stdio communication protocol
- **Security**: Input validation with Zod schemas and safe operations

## Architecture

The server follows the MCP specification and provides:

- Request/response handling over stdio
- Tool execution with proper error handling
- Resource access with caching
- Structured logging and monitoring
- Type-safe implementation with TypeScript

## Installation

### Global Installation (Recommended)

```bash
npm install -g fe-mcp
```

### Local Installation

```bash
npm install fe-mcp
```

### Development Installation

```bash
git clone https://github.com/yourusername/fe-mcp.git
cd fe-mcp
npm install
```

## Usage

### As a Global Package

```bash
fe-mcp
```

### As a Local Package

```bash
npx fe-mcp
```

### Development Mode

```bash
npm run dev
```

### Build & Run

```bash
npm run build
npm start
```

## Configuration

Configure in your MCP client (e.g., Claude Desktop) by adding to the configuration file:

### Global Installation

```json
{
  "mcpServers": {
    "fe-mcp": {
      "command": "fe-mcp"
    }
  }
}
```

### Local Installation

```json
{
  "mcpServers": {
    "fe-mcp": {
      "command": "npx",
      "args": ["fe-mcp"]
    }
  }
}
```

## Tools Available

1. **file_read**: Read file contents
2. **file_write**: Write content to files
3. **system_info**: Get system information
4. **list_directory**: List directory contents

## Resources Available

1. **server_config**: Server configuration
2. **system_status**: Current system status
