import { type Collection, CollectionHandler, getHandler } from "@/collections";
import type { EmitCodeGeneratorContext, Plugin } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import path from "node:path";
import type { Configuration } from "webpack";
import { withLoader } from "@/plugins/with-loader";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";
import { type AsyncPipe, asyncPipe } from "@/utils/pipe";
import { slash } from "@/utils/code-generator";
import type { FileCollectionHandler } from "./storage/fs";

export interface MetaTransformationContext {
  path: string;
  source: string;
}

export interface MetaCollectionHandler<
  Schema extends StandardSchemaV1 | undefined = undefined,
> extends CollectionHandler<
  "meta",
  {
    storage: FileCollectionHandler;
  }
> {
  schema?: Schema;
  /**
   * Transform metadata
   */
  transform: AsyncPipe<unknown, MetaTransformationContext>;
  $inferInput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Schema> : unknown;
  $inferOutput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Schema> : unknown;
}

export interface MetaCollectionConfig<Schema extends StandardSchemaV1 | undefined = undefined> {
  schema?: Schema;
}

export function metaHandler<Schema extends StandardSchemaV1 | undefined = undefined>(
  config: MetaCollectionConfig<Schema>,
): MetaCollectionHandler<Schema> {
  return {
    name: "meta",
    requirements: ["storage"],
    schema: config.schema,
    transform: asyncPipe(),
    init(collection) {
      collection.plugins.push(plugin());
    },
  };
}

function plugin(): Plugin {
  const metaLoaderGlob = /\.(json|yaml)(\?.+?)?$/;

  async function generateCollectionStore(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const fsHandler = getHandler<FileCollectionHandler>(collection, "storage");
    if (!fsHandler) return;
    const { codegen, core } = context;

    codegen.addNamedImport(["metaStore"], "fuma-content/collections/meta/runtime");
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );
    const base = slash(core._toRuntimePath(fsHandler.dir));
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
    dedupe: true,
    configureServer(server) {
      if (!server.watcher) return;

      server.watcher.on("all", async (event, file) => {
        if (event === "change") return;
        const updatedCollection = this.core.getCollections().find((collection) => {
          const fsHandler = getHandler<FileCollectionHandler>(collection, "storage");
          const metaHandler = getHandler<MetaCollectionHandler>(collection, "meta");
          if (!metaHandler || !fsHandler) return false;
          return fsHandler.hasFile(file);
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
          absoluteCompiledConfigPath: path.resolve(this.core.getCompiledConfigPath()),
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
