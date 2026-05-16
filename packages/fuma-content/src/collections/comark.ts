import type { Collection } from "@/collections";
import type { Core } from "@/core";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { CodeGenerator, slash } from "@/utils/code-generator";
import { validate } from "@/utils/validation";
import type { Awaitable } from "@/types";
import { asyncPipe } from "@/utils/pipe";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";
import path from "node:path";
import type { ComarkTree, ParseOptions } from "comark";
import { type AsyncCache, createCache } from "@/utils/async-cache";

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface ComarkCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends Omit<FileSystemCollectionConfig, "supportedFormats"> {
  frontmatter?: FrontmatterSchema;
  options?: ParseOptions | ((environment: "bundler" | "runtime") => Awaitable<ParseOptions>);
  lazy?: boolean;
}

interface InitializerCode {
  fn: string;
  typeParams: [config: string, name: string, attached: string];
  params: string[];
}

function formatInitializer(code: InitializerCode) {
  return `${code.fn}<${code.typeParams.join()}>(${code.params.join()})`;
}

export class ComarkCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  readonly lazy: boolean;

  #comarkOptions?: ComarkCollectionConfig["options"];
  #comarkOptionsCache?: AsyncCache<ParseOptions>;
  async getComarkOptions(environment: "bundler" | "runtime"): Promise<ParseOptions> {
    const options = this.#comarkOptions;
    if (!options) return {};
    if (typeof options !== "function") return options;

    this.#comarkOptionsCache ??= createCache();
    return this.#comarkOptionsCache.cached(environment, () => options(environment));
  }
  /**
   * Frontmatter schema
   */
  frontmatterSchema?: FrontmatterSchema;
  /**
   * Transform & validate frontmatter
   */
  frontmatter = asyncPipe<Record<string, unknown> | undefined, CompilationContext>();
  /**
   * Transform the parsed Comark tree.
   */
  tree = asyncPipe<ComarkTree, CompilationContext>();

  $inferFrontmatter: FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown> = undefined as never;

  constructor(config: ComarkCollectionConfig<FrontmatterSchema>) {
    super({
      dir: config.dir,
      files: config.files,
      supportedFormats: ["md", "mdc"],
    });
    this.#comarkOptions = config.options;
    this.lazy = config.lazy ?? false;
    this.frontmatterSchema = config.frontmatter;
    this.frontmatter.pipe(this.#onFrontmatter.bind(this));
    this.onServer.hook(this.#onServerHandler.bind(this));
    this.onEmit.pipe(this.#onEmitHandler.bind(this));
    this.pluginHook(loaderHook).loaders.push(comarkLoader());
  }

  #onFrontmatter: (typeof this.frontmatter)["$inferHandler"] = (data, { filePath }) => {
    if (!this.frontmatterSchema) return data;

    return validate(
      this.frontmatterSchema,
      data,
      undefined,
      `invalid frontmatter in ${filePath}`,
    ) as Promise<Record<string, unknown>>;
  };

  #onServerHandler: (typeof this.onServer)["$inferHandler"] = ({ server, core }) => {
    if (!server.watcher) return;

    server.watcher.on("all", async (event, file) => {
      if (event === "change" || !this.hasFile(file)) return;

      await core.emit({
        filterCollection: (item) => item === this,
        filterWorkspace: () => false,
        write: true,
      });
    });
  };

  #onEmitHandler: (typeof this.onEmit)["$inferHandler"] = async (
    entries,
    { core, createCodeGenerator },
  ) => {
    entries.push(
      await createCodeGenerator(`${this.name}.ts`, async ({ codegen }) => {
        const base = slash(core._toRuntimePath(this.dir));
        codegen.addNamespaceImport(
          "Config",
          codegen.formatImportPath(core.getOptions().configPath),
          true,
        );

        if (this.lazy) {
          codegen.addNamedImport(["comarkStoreLazy"], "fuma-content/collections/comark/runtime");
          const headGlob = await this.generateFrontmatterGlob(core, codegen, true);
          const bodyGlob = await this.generateTreeGlob(core, codegen);

          codegen.push(
            `export const ${this.name} = ${formatInitializer({
              fn: "comarkStoreLazy",
              typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
              params: [`"${this.name}"`, `"${base}"`, `{ head: ${headGlob}, body: ${bodyGlob} }`],
            })};`,
          );
        } else {
          codegen.addNamedImport(["comarkStore"], "fuma-content/collections/comark/runtime");

          codegen.push(
            `export const ${this.name} = ${formatInitializer({
              fn: "comarkStore",
              typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
              params: [
                `"${this.name}"`,
                `"${base}"`,
                await this.generateTreeGlob(core, codegen, true),
              ],
            })};`,
          );
        }
      }),
      await createCodeGenerator(`${this.name}.browser.ts`, async ({ codegen }) => {
        codegen.addNamedImport(
          ["comarkStoreBrowser"],
          "fuma-content/collections/comark/runtime-browser",
        );
        codegen.addNamespaceImport(
          "Config",
          codegen.formatImportPath(core.getOptions().configPath),
          true,
        );

        codegen.push(
          `export const ${this.name} = ${formatInitializer({
            fn: "comarkStoreBrowser",
            typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
            params: [`"${this.name}"`, await this.generateTreeGlob(core, codegen)],
          })};`,
        );
      }),
    );
    return entries;
  };

  private async generateFrontmatterGlob(core: Core, codegen: CodeGenerator, eager = false) {
    let s = `{`;
    const query = codegen.formatQuery({
      collection: this.name,
      only: "frontmatter",
      workspace: core.getWorkspace()?.name,
    });
    for (const file of await this.getFiles()) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query}`;
      if (eager) {
        const name = codegen.generateImportName();
        codegen.addNamedImport([`frontmatter as ${name}`], specifier);
        s += `"${slash(file)}": ${name},`;
      } else {
        s += `"${slash(file)}": () => ${codegen.formatDynamicImport(specifier, "frontmatter")},`;
      }
    }
    s += "}";
    return s;
  }

  private async generateTreeGlob(core: Core, codegen: CodeGenerator, eager = false) {
    let s = `{`;
    const query = codegen.formatQuery({
      collection: this.name,
      workspace: core.getWorkspace()?.name,
    });
    for (const file of await this.getFiles()) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query}`;
      if (eager) {
        const name = codegen.generateImportName();
        codegen.addNamedImport([`default as ${name}`], specifier);
        s += `"${slash(file)}": ${name},`;
      } else {
        s += `"${slash(file)}": () => ${codegen.formatDynamicImport(specifier, "default")},`;
      }
    }
    s += "}";
    return s;
  }
}

export function comarkCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
>(config: ComarkCollectionConfig<FrontmatterSchema>) {
  return new ComarkCollection(config);
}

function comarkLoader(): LoaderConfig {
  const test = /\.(?:md|mdc)(\?.+?)?$/;

  return {
    id: "comark",
    test,
    configureNext(nextConfig) {
      const loaderPath = "fuma-content/collections/comark/loader-webpack";
      const loaderOptions = this.getLoaderOptions();

      return {
        ...nextConfig,
        turbopack: {
          ...nextConfig.turbopack,
          rules: {
            ...nextConfig.turbopack?.rules,
            "*.{md,mdc}": {
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
            use: [
              options.defaultLoaders.babel,
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
      const { createComarkLoader } = await import("./comark/loader");
      return createComarkLoader({
        getCore: () => this.core,
      });
    },
  };
}

export type { ComarkTree, ParseOptions } from "comark";
