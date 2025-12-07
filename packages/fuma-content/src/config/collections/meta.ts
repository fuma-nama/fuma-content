import { type Collection, createCollection } from "@/config/collections";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/config/collections/fs";
import type { Core, Plugin } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { WebpackLoaderOptions } from "@/webpack";
import path from "node:path";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import { withLoader } from "@/plugins/with-loader";

type Awaitable<T> = T | Promise<T>;

type Schema = StandardSchemaV1 | ((context: MetaContext) => StandardSchemaV1);

export interface MetaContext {
  path: string;
  source: string;
}

export interface MetaCollectionHandler {
  /**
   * Transform metadata
   */
  transform?: (
    this: MetaContext,
    data: unknown,
  ) => Awaitable<unknown | undefined>;
  schema?: Schema;
}

export interface MetaCollectionConfig extends FileHandlerConfig {
  schema?: Schema;
}

export function defineMeta(config: MetaCollectionConfig): Collection {
  return createCollection({
    init(options) {
      this.handlers.fs = buildFileHandler(options, config, ["json", "yaml"]);
      this.handlers.meta = {
        schema: config.schema,
      };
      this.handlers["json-schema"] = {
        async create() {
          const { z, ZodType } = await import("zod");

          if (config.schema instanceof ZodType)
            return z.toJSONSchema(config.schema, {
              io: "input",
              unrepresentable: "any",
            });
        },
      };
    },
  });
}

export function metaPlugin(): Plugin {
  const metaLoaderGlob = /\.(json|yaml)(\?.+?)?$/;
  let core: Core;

  return withLoader(
    {
      name: "meta",
      config() {
        core = this.core;
      },
      next: {
        config(nextConfig) {
          const { configPath, outDir } = this.core.getOptions();
          const loaderOptions: WebpackLoaderOptions = {
            configPath,
            outDir,
            absoluteCompiledConfigPath: path.resolve(
              this.core.getCompiledConfigPath(),
            ),
            isDev: process.env.NODE_ENV === "development",
          };

          return {
            ...nextConfig,
            turbopack: {
              ...nextConfig.turbopack,
              rules: {
                ...nextConfig.turbopack?.rules,
                "*.json": {
                  loaders: [
                    {
                      loader: "fuma-content/loader-meta",
                      options:
                        loaderOptions as unknown as TurbopackLoaderOptions,
                    },
                  ],
                  as: "*.json",
                },
                "*.yaml": {
                  loaders: [
                    {
                      loader: "fuma-content/loader-meta",
                      options:
                        loaderOptions as unknown as TurbopackLoaderOptions,
                    },
                  ],
                  as: "*.js",
                },
              },
            },
            webpack: (config: Configuration, options) => {
              config.resolve ||= {};
              config.module ||= {};
              config.module.rules ||= [];
              config.module.rules.push({
                test: metaLoaderGlob,
                enforce: "pre",
                use: [
                  {
                    loader: "fuma-content/loader-meta",
                    options: loaderOptions,
                  },
                ],
              });

              return nextConfig.webpack?.(config, options) ?? config;
            },
          };
        },
      },
    },
    {
      test: metaLoaderGlob,
      createLoader: () =>
        import("./meta/loader").then((mod) =>
          mod.createMetaLoader({
            getCore: async () => core,
          }),
        ),
    },
  );
}
