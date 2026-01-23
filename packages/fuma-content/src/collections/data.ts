import type { EmitCodeGeneratorContext } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import { asyncPipe } from "@/utils/pipe";
import { slash } from "@/utils/code-generator";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";

export interface DataTransformationContext {
  path: string;
  source: string;
}

export interface DataCollectionConfig<Schema extends StandardSchemaV1 | undefined> extends Omit<
  FileSystemCollectionConfig,
  "supportedFormats"
> {
  schema?: Schema;
}

export class DataCollection<
  Schema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  schema?: Schema;
  /**
   * Transform data
   */
  readonly onLoad = asyncPipe<unknown, DataTransformationContext>();
  $inferInput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Schema> : unknown;
  $inferOutput?: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Schema> : unknown;

  constructor(config: DataCollectionConfig<Schema>) {
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
        createCodeGenerator(`${this.name}.ts`, (ctx) => this.generateCollectionStore(ctx)),
      ]);
    });
    this.pluginHook(loaderHook).loaders.push(jsonLoader(), yamlLoader());
  }

  private async generateCollectionStore(context: EmitCodeGeneratorContext) {
    const { codegen, core } = context;
    codegen.addNamedImport(["dataStore"], "fuma-content/collections/data/runtime");
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
      `export const ${this.name} = dataStore<typeof Config, "${this.name}">("${this.name}", "${base}", ${glob});`,
    );
  }
}

export function dataCollection<Schema extends StandardSchemaV1 | undefined = undefined>(
  config: DataCollectionConfig<Schema>,
) {
  return new DataCollection(config);
}

function yamlLoader(): LoaderConfig {
  const test = /\.yaml(\?.+?)?$/;

  return {
    id: "yaml",
    test,
    configureNext(nextConfig) {
      const loaderPath = "fuma-content/collections/yaml/loader-webpack";
      const loaderOptions = this.getLoaderOptions();

      return {
        ...nextConfig,
        turbopack: {
          ...nextConfig.turbopack,
          rules: {
            ...nextConfig.turbopack?.rules,
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
            test,
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
    async createLoader() {
      const { createYamlLoader } = await import("./yaml/loader");
      return createYamlLoader({
        getCore: () => this.core,
      });
    },
  };
}

function jsonLoader(): LoaderConfig {
  const test = /\.json(\?.+?)?$/;

  return {
    id: "json",
    test,
    configureNext(nextConfig) {
      const loaderPath = "fuma-content/collections/json/loader-webpack";
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
          },
        },
        webpack(config: Configuration, options) {
          config.module ||= {};
          config.module.rules ||= [];
          config.module.rules.push({
            test,
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
      const { createJsonLoader } = await import("./json/loader");
      return createJsonLoader(
        {
          getCore: () => this.core,
        },
        environment === "vite" ? "json" : "js",
      );
    },
  };
}
