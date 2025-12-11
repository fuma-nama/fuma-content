import {
  type Collection,
  type CollectionTypeInfo,
  createCollection,
} from "@/collections";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/collections/handlers/fs";
import type { EmitCodeGeneratorContext, Plugin } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import path from "node:path";
import type { Configuration } from "webpack";
import { withLoader } from "@/plugins/with-loader";
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

const metaTypeInfo: CollectionTypeInfo = {
  id: "meta",
  plugins: [plugin()],
};

export function defineMeta<Schema extends StandardSchemaV1>(
  config: MetaCollectionConfig<Schema>,
): MetaCollection<
  Schema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<Schema>
    : Record<string, unknown>
> {
  return createCollection(metaTypeInfo, (collection, options) => {
    const handlers = collection.handlers;
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
  });
}

function plugin(): Plugin {
  const metaLoaderGlob = /\.(json|yaml)(\?.+?)?$/;

  async function generateCollectionStore(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const fsHandler = collection.handlers.fs;
    if (!fsHandler) return;
    const { codegen, core } = context;

    codegen.addNamedImport(
      ["metaStore"],
      "fuma-content/collections/meta/runtime",
    );
    codegen.addNamedImport(
      ["default as Config"],
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );
    const base = path.relative(process.cwd(), fsHandler.dir);
    const glob = await codegen.generateGlobImport(fsHandler.patterns, {
      query: {
        collection: collection.name,
        workspace: context.workspace,
      },
      import: "default",
      base: fsHandler.dir,
      eager: true,
    });
    const initializer = `metaStore<typeof Config, "${collection.name}">("${collection.name}", "${base}", ${glob})`;
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  const base: Plugin = {
    name: "meta",
    configureServer(server) {
      if (!server.watcher) return;

      server.watcher.on("all", async (event, file) => {
        if (event === "change") return;
        const updatedCollection = this.core
          .getCollections()
          .find((collection) => {
            const handlers = collection.handlers;
            if (!handlers.meta || !handlers.fs) return false;
            return handlers.fs.hasFile(file);
          });

        if (!updatedCollection) return;
        await this.core.emit({
          filterPlugin: (plugin) => plugin.name === "meta",
          filterWorkspace: () => false,
          write: true,
        });
      });
    },
    emit() {
      return Promise.all([
        this.createCodeGenerator("meta.ts", async (ctx) => {
          for (const collection of this.core.getCollections()) {
            await generateCollectionStore(ctx, collection);
          }
        }),
      ]);
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
                    options: loaderOptions as unknown as TurbopackLoaderOptions,
                  },
                ],
                as: "*.json",
              },
              "*.yaml": {
                loaders: [
                  {
                    loader: loaderPath,
                    options: loaderOptions as unknown as TurbopackLoaderOptions,
                  },
                ],
                as: "*.js",
              },
            },
          },
          webpack(config: Configuration, options) {
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
  };

  return withLoader(base, {
    test: metaLoaderGlob,
    async createLoader(environment) {
      const { createMetaLoader } = await import("./meta/loader");
      return createMetaLoader(
        {
          getCore: () => this.core,
        },
        {
          json: environment === "vite" ? "json" : "js",
        },
      );
    },
  });
}
