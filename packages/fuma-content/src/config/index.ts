import { Collection } from "@/collections";
import type { PluginOption } from "@/core";

export interface GlobalConfig<
  Collections extends Record<string, Collection> = Record<string, Collection>,
> {
  plugins?: PluginOption[];
  collections?: Collections;
  workspaces?: Record<string, WorkspaceConfig>;

  /**
   * specify a directory to access & store cache (disabled during development mode).
   *
   * The cache will never be updated, delete the cache folder to clean.
   */
  experimentalBuildCache?: string;

  /**
   * configure code generation
   */
  emit?: {
    target?: "default" | "vite";
    /**
     * add .js extenstion to imports
     */
    jsExtension?: boolean;
  };
}

export interface WorkspaceConfig {
  dir: string;
  config: GlobalConfig | { default: GlobalConfig };
}

export function defineConfig<
  Collections extends Record<string, Collection> = Record<string, Collection>,
>(config: GlobalConfig<Collections> = {}): GlobalConfig<Collections> {
  return config;
}
