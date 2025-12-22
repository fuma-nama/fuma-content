import type { Plugin, PluginContext } from "@/core";

type Awaitable<T> = T | Promise<T>;

export interface CompilerOptions {
  addDependency: (file: string) => void;
}

type LoaderEnvironment = "vite" | "bun" | "node";

export interface Loader {
  /**
   * Transform input into JavaScript.
   *
   * Returns:
   * - `LoaderOutput`: JavaScript code & source map.
   * - `null`: skip the loader. Fallback to default behaviour if possible, otherwise the adapter will try workarounds.
   */
  load: (input: LoaderInput) => Awaitable<LoaderOutput | null>;

  bun?: {
    /**
     * 1. Bun doesn't allow `null` in loaders.
     * 2. Bun requires sync result to support dynamic require().
     */
    load?: (source: string, input: LoaderInput) => Awaitable<Bun.OnLoadResult>;
  };
}

export interface LoaderInput {
  development: boolean;
  compiler: CompilerOptions;

  filePath: string;
  query: Record<string, string | string[] | undefined>;
  getSource: () => string | Promise<string>;
}

export interface LoaderOutput {
  code: string;
  map?: unknown;
}

export interface WithLoaderConfig {
  /**
   * Filter file paths, the input can be either a file URL or file path.
   *
   * Must take resource query into consideration.
   */
  test?: RegExp;

  createLoader: (this: PluginContext, environment: LoaderEnvironment) => Promise<Loader>;
}

/**
 * a light layer for implementing loaders.
 *
 * @remarks it doesn't include Next.js, you have to define the webpack/turbopack config, and export the loaders on your own.
 */
export function withLoader(plugin: Plugin, { test, createLoader }: WithLoaderConfig): Plugin {
  let loader: Promise<Loader> | undefined;

  return {
    bun: {
      async build(build) {
        const { toBun } = await import("./bun");
        toBun(test, await (loader ??= createLoader.call(this, "bun")))(build);
      },
    },
    node: {
      async createLoad() {
        const { toNode } = await import("./node");
        return toNode(test, await (loader ??= createLoader.call(this, "node")));
      },
    },
    vite: {
      async createPlugin() {
        const { toVite } = await import("./vite");
        return toVite(plugin.name, test, await (loader ??= createLoader.call(this, "vite")));
      },
    },
    ...plugin,
  };
}
