import type { PluginOption } from "@/core";

export interface GlobalConfig {
  plugins?: PluginOption[];

  workspaces?: Record<string, Omit<WorkspaceConfig, "name">>;

  /**
   * specify a directory to access & store cache (disabled during development mode).
   *
   * The cache will never be updated, delete the cache folder to clean.
   */
  experimentalBuildCache?: string;
}

export interface WorkspaceConfig {
  name: string;
  dir: string;
  config: Record<string, unknown>;
}

export function defineConfig(config: GlobalConfig = {}): GlobalConfig {
  return config;
}
