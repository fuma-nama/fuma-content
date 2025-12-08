import type { PluginOption } from "@/core";
import type { Collection } from "@/collections";

export interface GlobalConfig<
  Collections extends Record<string, Collection> = Record<string, Collection>,
> {
  plugins?: PluginOption[];
  collections?: Collections;
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
  config: GlobalConfig | { default: GlobalConfig };
}

export function defineConfig<
  Collections extends Record<string, Collection> = Record<string, Collection>,
>(config: GlobalConfig<Collections> = {}): GlobalConfig<Collections> {
  return config;
}
