import type { EmitCodeGeneratorContext } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import { asyncPipe } from "@/utils/pipe";
import { slash } from "@/utils/code-generator";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";

export interface MetaTransformationContext {
  path: string;
  source: string;
}

export interface MetaCollectionConfig<Schema extends StandardSchemaV1 | undefined> extends Omit<
  FileSystemCollectionConfig,
  "supportedFormats"
> {
  schema?: Schema;
}

export class MetaCollection<
  Schema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  schema?: Schema;
  /**
   * Transform metadata
   */
  readonly onLoad = asyncPipe<unknown, MetaTransformationContext>();
  $inferInput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Schema> : unknown;
  $inferOutput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Schema> : unknown;

  constructor(config: MetaCollectionConfig<Schema>) {
    super({
      dir: config.dir,
      files: config.files,
      supportedFormats: ["json", "yaml"],
    });
    this.schema = config.schema;
    this.onServer.hook(({ core, server }) => {
      if (!server.watcher) return;

      server.watcher.on("all", async (event, file) => {
        if (event === "change" || !this.hasFile(file)) return;

        await core.emit({
          filterCollection: (collection) => collection === this,
          filterWorkspace: () => false,
          write: true,
        });
      });
    });
    this.onEmit.pipe((entries, { createCodeGenerator }) => {
      return Promise.all([
        ...entries,
        createCodeGenerator("meta.ts", (ctx) => this.generateCollectionStore(ctx)),
      ]);
    });
    this.pluginHook(loaderHook).loaders.push(metaLoader());
  }

  private async generateCollectionStore(context: EmitCodeGeneratorContext) {
    const { codegen, core } = context;
    codegen.addNamedImport(["metaStore"], "fuma-content/collections/meta/runtime");
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );
    const base = slash(core._toRuntimePath(this.dir));
    const glob = await codegen.generateGlobImport(this.patterns, {
      query: {
        collection: this.name,
        workspace: context.workspace,
      },
      import: "default",
      base: this.dir,
      eager: true,
    });
    codegen.push(
      `export const ${this.name} = metaStore<typeof Config, "${this.name}">("${this.name}", "${base}", ${glob});`,
    );
  }
}

export function metaCollection<Schema extends StandardSchemaV1 | undefined = undefined>(
  config: MetaCollectionConfig<Schema>,
) {
  return new MetaCollection(config);
}

function metaLoader(): LoaderConfig {
  const metaLoaderGlob = /\.(json|yaml)(\?.+?)?$/;

  return {
    id: "json+yaml",
    test: metaLoaderGlob,
    configureNext(nextConfig) {
      const loaderPath = "fuma-content/collections/meta/loader-webpack";
      const loaderOptions = this.getLoaderOptions();

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
  };
}
