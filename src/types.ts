// Common type definitions for the MCP server

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  release: string;
  uptime: number;
  loadavg: number[];
  totalmem: number;
  freemem: number;
  cpus: Array<{
    model: string;
    speed: number;
  }>;
  networkInterfaces: string[];
  userInfo: {
    username: string;
    uid: number;
    gid: number;
    shell: string;
    homedir: string;
  };
  homedir: string;
  tmpdir: string;
  timestamp: string;
}

export interface DirectoryItem {
  name: string;
  type: "file" | "directory";
  path: string;
}

export interface FileReadArgs {
  path: string;
}

export interface FileWriteArgs {
  path: string;
  content: string;
}

export interface ListDirectoryArgs {
  path: string;
}
