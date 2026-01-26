import { defineCollectionHook } from "@/collections";
import type { Plugin, PluginContext } from "@/core";
import { createCache } from "@/utils/async-cache";
import { NextConfig } from "next";
import { WebpackLoaderOptions } from "./webpack.js";
import path from "node:path";

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

  /**
   * only supported on Vite 8 at the moment, specify the output module type.
   *
   * on unsupported environments, it will be ignored.
   */
  moduleType?: "js" | "json";
}

interface NextLoaderContext extends PluginContext {
  getLoaderOptions: () => WebpackLoaderOptions;
}

export interface LoaderConfig {
  /** unique ID for loader, used to deduplicate loaders */
  id?: string;

  /**
   * Filter file paths, the input can be either a file URL or file path.
   *
   * Must take resource query into consideration.
   */
  test?: RegExp;

  /**
   * @remarks it doesn't configure automatically for Next.js, you have to define the webpack/turbopack config in `configureNext()`.
   */
  createLoader: (this: PluginContext, environment: LoaderEnvironment) => Promise<Loader>;
  configureNext?: (this: NextLoaderContext, next: NextConfig) => NextConfig;
}

interface ResolvedLoader {
  id: string;
  test: RegExp | undefined;
  loader: Loader;
}

/**
 * a light layer for implementing loaders.
 */
export function loaderPlugin(): Plugin {
  // env -> loaders
  const cachedLoaders = createCache<ResolvedLoader[]>();

  function initLoaders(ctx: PluginContext, env: LoaderEnvironment) {
    return cachedLoaders.cached(env, async () => {
      const usedIds = new Set<string>();
      const out: ResolvedLoader[] = [];

      for (const collection of ctx.core.getCollections()) {
        const hook = collection.getPluginHook(loaderHook);
        if (!hook) continue;

        let nextId = 0;
        for (const loader of hook.loaders) {
          if (loader.id && usedIds.has(loader.id)) continue;
          if (loader.id) usedIds.add(loader.id);

          out.push({
            id: loader.id ?? `${collection.name}:${nextId++}`,
            test: loader.test,
            loader: await loader.createLoader.call(ctx, env),
          });
        }
      }
      return out;
    });
  }

  return {
    name: "fuma-content:loader",
    next: {
      config(config) {
        const ctx: NextLoaderContext = {
          ...this,
          getLoaderOptions: () => {
            const { configPath, outDir } = this.core.getOptions();
            return {
              configPath,
              outDir,
              absoluteCompiledConfigPath: path.resolve(this.core.getCompiledConfigPath()),
              isDev: process.env.NODE_ENV === "development",
            };
          },
        };
        for (const collection of this.core.getCollections()) {
          const hook = collection.getPluginHook(loaderHook);
          if (!hook) continue;

          for (const loader of hook.loaders) {
            if (!loader.configureNext) continue;

            config = loader.configureNext.call(ctx, config);
          }
        }

        return config;
      },
    },
    bun: {
      async setup(build) {
        const { toBun } = await import("./bun");

        for (const loader of await initLoaders(this, "bun")) {
          toBun(loader.test, loader.loader)(build);
        }
      },
    },
    node: {
      async createLoad() {
        const { toNode } = await import("./node");
        return toNode(await initLoaders(this, "node"));
      },
    },
    vite: {
      async createPlugin() {
        const { toVite } = await import("./vite");
        return (await initLoaders(this, "vite")).map((loader) => {
          return toVite(`fuma-content:${loader.id}`, loader.test, loader.loader);
        });
      },
    },
  };
}

export interface LoaderHook {
  loaders: LoaderConfig[];
}

export const loaderHook = defineCollectionHook<LoaderHook>(() => ({
  loaders: [],
}));
