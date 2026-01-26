import type { EmitCodeGeneratorContext } from "@/core";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import { asyncPipe } from "@/utils/pipe";
import { slash } from "@/utils/code-generator";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";
import path from "node:path";

export interface DataTransformationContext {
  path: string;
  source: string;
}

interface LoadersConfig {
  json?: boolean;
  yaml?: boolean;
  custom?: Record<string, LoaderConfig>;
}

export interface DataCollectionConfig<Schema extends StandardSchemaV1 | undefined> extends Omit<
  FileSystemCollectionConfig,
  "supportedFormats"
> {
  schema?: Schema;
  /**
   * Configurations for loaders to parse data files.
   *
   * By default, JSON and YAML are enabled.
   * */
  loaders?: LoadersConfig;
}

export class DataCollection<
  Schema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  schema?: Schema;
  /**
   * Transform data
   */
  readonly onLoad = asyncPipe<unknown, DataTransformationContext>();
  $inferInput: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Schema> : unknown =
    undefined as never;
  $inferOutput: Schema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Schema> : unknown =
    undefined as never;

  constructor({ dir, files, loaders: _loadersConfig = {}, schema }: DataCollectionConfig<Schema>) {
    const loadersConfig: Record<string, LoaderConfig> = {
      ..._loadersConfig.custom,
    };
    if (_loadersConfig.json !== false) loadersConfig.json = jsonLoader();
    if (_loadersConfig.yaml !== false) loadersConfig.yaml = yamlLoader();

    super({ dir, files, supportedFormats: Object.keys(loadersConfig) });
    this.schema = schema;
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
    this.onEmit.pipe(async (entries, { createCodeGenerator }) => {
      entries.push(
        await createCodeGenerator(`${this.name}.ts`, (ctx) => this.generateCollectionStore(ctx)),
      );
      return entries;
    });

    this.pluginHook(loaderHook).loaders.push(...Object.values(loadersConfig));
  }

  private async generateCollectionStore(context: EmitCodeGeneratorContext) {
    const { codegen, core, workspace } = context;
    codegen.addNamedImport(["dataStore"], "fuma-content/collections/data/runtime");
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );
    const base = slash(core._toRuntimePath(this.dir));
    let records = "{";
    const query = codegen.formatQuery({
      collection: this.name,
      workspace,
    });
    for (const file of await this.getFiles()) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query}`;
      const name = codegen.generateImportName();
      codegen.addNamedImport([`default as ${name}`], specifier);
      records += `"${slash(file)}": ${name},`;
    }
    records += "}";
    codegen.push(
      `export const ${this.name} = dataStore<typeof Config, "${this.name}">("${this.name}", "${base}", ${records});`,
    );
  }
}

export function dataCollection<Schema extends StandardSchemaV1 | undefined = undefined>(
  config: DataCollectionConfig<Schema>,
) {
  return new DataCollection(config);
}

export function yamlLoader(): LoaderConfig {
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

export function jsonLoader(): LoaderConfig {
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
