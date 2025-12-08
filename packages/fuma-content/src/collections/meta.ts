import { type Collection, createCollection } from "@/collections/index";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/collections/file-list";
import type { Core, Plugin } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import path from "node:path";
import type { Configuration } from "webpack";
import { withLoader } from "@/plugins/with-loader";
import { CollectionListGenerator } from "@/collections/list";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";

type Awaitable<T> = T | Promise<T>;

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
  schema?: StandardSchemaV1 | ((context: MetaContext) => StandardSchemaV1);
}

export interface MetaCollectionConfig<
  Schema extends StandardSchemaV1,
> extends FileHandlerConfig {
  schema?: Schema | ((context: MetaContext) => Schema);
}

export type MetaCollection<_Data> = Collection & {
  _type?: _Data;
};

export function defineMeta<Schema extends StandardSchemaV1>(
  config: MetaCollectionConfig<Schema>,
): MetaCollection<
  Schema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<Schema>
    : Record<string, unknown>
> {
  return createCollection({
    init(options) {
      const collection = this;
      const handlers = this.handlers;
      handlers.fs = buildFileHandler(options, config, ["json", "yaml"]);
      handlers.meta = {
        schema: config.schema,
      };
      handlers["json-schema"] = {
        async create() {
          const { z, ZodType } = await import("zod");

          if (config.schema instanceof ZodType)
            return z.toJSONSchema(config.schema, {
              io: "input",
              unrepresentable: "any",
            });
        },
      };
      handlers["entry-file"] = {
        async generate(context) {
          const fsHandler = handlers.fs;
          if (!fsHandler) return;

          const { codegen } = context;
          codegen.addNamedImport(
            ["metaList"],
            "fuma-content/collections/meta/runtime",
          );
          const base = path.relative(process.cwd(), fsHandler.dir);
          const glob = await codegen.generateGlobImport(fsHandler.patterns, {
            query: {
              collection: collection.name,
              workspace: options.workspace?.name,
            },
            import: "default",
            base: fsHandler.dir,
            eager: true,
          });
          const list = new CollectionListGenerator(
            `metaList<typeof Config, "${collection.name}">("${collection.name}", "${base}", ${glob})`,
          );
          codegen.push(`export const ${collection.name} = ${list.flush()};`);
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
          const loaderPath = "fuma-content/collections/meta/loader-webpack";
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
                      loader: loaderPath,
                      options:
                        loaderOptions as unknown as TurbopackLoaderOptions,
                    },
                  ],
                  as: "*.json",
                },
                "*.yaml": {
                  loaders: [
                    {
                      loader: loaderPath,
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
                    loader: loaderPath,
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
            getCore: () => core,
          }),
        ),
    },
  );
}
