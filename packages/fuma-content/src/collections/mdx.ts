import type { Collection } from "@/collections";
import type { PostprocessOptions } from "@/collections/mdx/remark-postprocess";
import type { Core, CoreOptions } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { CodeGenerator, slash } from "@/utils/code-generator";
import { validate } from "@/utils/validation";
import type { Awaitable } from "@/types";
import { asyncPipe, pipe } from "@/utils/pipe";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";
import { GitHook, gitHook } from "@/plugins/git";
import path from "node:path";
import type { PluggableList } from "unified";

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined,
> extends Omit<FileSystemCollectionConfig, "supportedFormats"> {
  postprocess?: Partial<PostprocessOptions>;
  preprocess?: PreprocessOptions;
  frontmatter?: FrontmatterSchema;
  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  lazy?: boolean;
  dynamic?: boolean;
}

interface PreprocessOptions {
  remarkPlugins?: PluggableList;
}

const RuntimePaths = {
  browser: "fuma-content/collections/mdx/runtime-browser",
  dynamic: "fuma-content/collections/mdx/runtime-dynamic",
  server: "fuma-content/collections/mdx/runtime",
};

interface InitializerCode {
  fn: string;
  typeParams: [config: string, name: string, attached: string];
  params: string[];
}

function formatInitializer(code: InitializerCode) {
  return `${code.fn}<${code.typeParams.join()}>(${code.params.join()})`;
}

export class MDXCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  readonly dynamic: boolean;
  readonly lazy: boolean;
  readonly preprocess?: PreprocessOptions;
  readonly postprocess?: Partial<PostprocessOptions>;
  readonly getMDXOptions?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  /**
   * Frontmatter schema
   */
  frontmatterSchema?: FrontmatterSchema;
  /**
   * Transform & validate frontmatter
   */
  frontmatter = asyncPipe<Record<string, unknown> | undefined, CompilationContext>();
  /**
   * Transform `vfile` on compilation stage
   */
  vfile = asyncPipe<VFile, CompilationContext>();
  /**
   * Transform the generated initializer code (TypeScript) for collection store
   */
  storeInitializer = pipe<
    InitializerCode,
    {
      codegen: CodeGenerator;
      environment: "browser" | "server" | "dynamic";
    }
  >();

  $inferFrontmatter: FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown> = undefined as never;

  constructor(config: MDXCollectionConfig<FrontmatterSchema>) {
    super({
      dir: config.dir,
      files: config.files,
      supportedFormats: ["md", "mdx"],
    });
    this.postprocess = config.postprocess;
    this.preprocess = config.preprocess;
    this.getMDXOptions = config.options;
    this.dynamic = config.dynamic ?? false;
    this.lazy = config.lazy ?? false;
    this.frontmatterSchema = config.frontmatter;
    this.frontmatter.pipe(this.#onFrontmatter.bind(this));
    this.onServer.hook(this.#onServerHandler.bind(this));
    this.onEmit.pipe(this.#onEmitHandler.bind(this));
    this.pluginHook(loaderHook).loaders.push(mdxLoader());
    this.pluginHook(gitHook).onClient.hook(this.#onGitHandler.bind(this));

    if (this.postprocess) {
      const { processedMarkdown, linkReferences, mdast } = this.postprocess;

      if (processedMarkdown) {
        const { as = "_markdown" } = processedMarkdown === true ? {} : processedMarkdown;

        this.storeInitializer.pipe((code) => {
          code.typeParams[2] += ` & { /** Processed Markdown */ ${as}: string; }`;
          return code;
        });
      }

      if (mdast) {
        const { as = "_mdast" } = mdast === true ? {} : mdast;

        this.storeInitializer.pipe((code) => {
          code.typeParams[2] += ` & { /** MDAST (as JSON string) */ ${as}: string; }`;
          return code;
        });
      }

      if (linkReferences) {
        const { as = "_linkReferences" } = linkReferences === true ? {} : linkReferences;

        this.storeInitializer.pipe((code, { codegen }) => {
          codegen.addNamedImport(["LinkReference"], "fuma-content/collections/mdx", true);
          code.typeParams[2] += ` & { /** extracted link references (e.g. hrefs, paths), useful for analyzing relationships between pages. */ ${as}: LinkReference[] }`;
          return code;
        });
      }
    }
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
      if (event === "change" && !this.dynamic) return;
      if (!this.hasFile(file)) return;

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
        const runtimePath = RuntimePaths.server;
        const base = slash(core._toRuntimePath(this.dir));
        let code: InitializerCode;
        codegen.addNamespaceImport(
          "Config",
          codegen.formatImportPath(core.getOptions().configPath),
          true,
        );

        if (this.lazy) {
          codegen.addNamedImport(["mdxStoreLazy"], runtimePath);
          const headGlob = await this.generateDocCollectionFrontmatterGlob(core, codegen, true);
          const bodyGlob = await this.generateDocCollectionGlob(core, codegen);

          code = {
            fn: "mdxStoreLazy",
            typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
            params: [`"${this.name}"`, `"${base}"`, `{ head: ${headGlob}, body: ${bodyGlob} }`],
          };
        } else {
          codegen.addNamedImport(["mdxStore"], runtimePath);
          code = {
            fn: "mdxStore",
            typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
            params: [
              `"${this.name}"`,
              `"${base}"`,
              await this.generateDocCollectionGlob(core, codegen, true),
            ],
          };
        }

        code = this.storeInitializer.run(code, {
          codegen,
          environment: "server",
        });
        codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
      }),
      await createCodeGenerator(`${this.name}.browser.ts`, async ({ codegen }) => {
        const runtimePath = RuntimePaths.browser;
        codegen.addNamedImport(["mdxStoreBrowser"], runtimePath);
        codegen.addNamespaceImport(
          "Config",
          codegen.formatImportPath(core.getOptions().configPath),
          true,
        );

        let code: InitializerCode = {
          fn: `mdxStoreBrowser`,
          typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
          params: [`"${this.name}"`, await this.generateDocCollectionGlob(core, codegen)],
        };
        code = this.storeInitializer.run(code, {
          codegen,
          environment: "browser",
        });
        codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
      }),
    );
    if (this.dynamic)
      entries.push(
        await createCodeGenerator(`${this.name}.dynamic.ts`, async ({ codegen }) => {
          const coreOptions = core.getOptions();
          const runtimePath = RuntimePaths.dynamic;
          const base = slash(core._toRuntimePath(this.dir));
          codegen.addNamespaceImport("Config", codegen.formatImportPath(coreOptions.configPath));
          codegen.addNamedImport(["mdxStoreDynamic"], runtimePath);

          const serializableCoreOptions: CoreOptions = {
            configPath: core._toRuntimePath(coreOptions.configPath),
            outDir: core._toRuntimePath(coreOptions.outDir),
            cwd: core._toRuntimePath(coreOptions.cwd),
          };

          const jsxImportSource =
            (await this.getMDXOptions?.("runtime"))?.jsxImportSource ?? "react";
          if (!jsxImportSource)
            throw new Error(
              `[Fuma Content] "jsxImportSource" is required for dynamic MDX collection "${this.name}".`,
            );
          codegen.addNamespaceImport("_jsx_runtime", `${jsxImportSource}/jsx-runtime`);

          let code: InitializerCode = {
            fn: "mdxStoreDynamic",
            typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
            params: [
              "Config",
              JSON.stringify(serializableCoreOptions),
              `"${this.name}"`,
              `"${base}"`,
              await this.generateDocCollectionFrontmatterGlob(core, codegen, true),
              "_jsx_runtime",
            ],
          };

          code = this.storeInitializer.run(code, {
            codegen,
            environment: "dynamic",
          });
          codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
        }),
      );
    return entries;
  };

  #onGitHandler: GitHook["onClient"]["$inferHandler"] = async ({ client }) => {
    this.storeInitializer.pipe((code, { codegen, environment }) => {
      codegen.addNamedImport(["WithGit"], RuntimePaths[environment], true);
      code.typeParams[2] += " & WithGit";
      return code;
    });

    this.vfile.pipe(async (file) => {
      const vcData = await client.getFileData({ filePath: file.path });
      file.data["mdx-export"] ??= [];
      file.data["mdx-export"].push(
        {
          name: "lastModified",
          value: vcData.lastModified,
        },
        {
          name: "creationDate",
          value: vcData.creationDate,
        },
      );
      return file;
    });
  };

  private async generateDocCollectionFrontmatterGlob(
    core: Core,
    codegen: CodeGenerator,
    eager = false,
  ) {
    let s = `{`;
    const files = await this.getFiles();
    const query = codegen.formatQuery({
      collection: this.name,
      only: "frontmatter",
      workspace: core.getWorkspace()?.name,
    });
    for (const file of files) {
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

  private async generateDocCollectionGlob(core: Core, codegen: CodeGenerator, eager = false) {
    let s = `{`;
    const files = await this.getFiles();
    const query = codegen.formatQuery({
      collection: this.name,
      workspace: core.getWorkspace()?.name,
    });
    for (const file of files) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query}`;
      if (eager) {
        const name = codegen.generateImportName();
        codegen.addNamespaceImport(name, specifier);
        s += `"${slash(file)}": ${name},`;
      } else {
        s += `"${slash(file)}": () => ${codegen.formatDynamicImport(specifier)},`;
      }
    }
    s += "}";
    return s;
  }
}

export function mdxCollection<FrontmatterSchema extends StandardSchemaV1 | undefined = undefined>(
  config: MDXCollectionConfig<FrontmatterSchema>,
) {
  return new MDXCollection(config);
}

function mdxLoader(): LoaderConfig {
  const test = /\.mdx?(\?.+?)?$/;

  return {
    id: "mdx",
    test,
    configureNext(nextConfig) {
      const loaderPath = "fuma-content/collections/mdx/loader-webpack";
      const loaderOptions = this.getLoaderOptions();

      return {
        ...nextConfig,
        turbopack: {
          ...nextConfig.turbopack,
          rules: {
            ...nextConfig.turbopack?.rules,
            "*.{md,mdx}": {
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
        pageExtensions: [...(nextConfig.pageExtensions ?? ["js", "jsx", "tsx", "ts"]), "mdx", "md"],
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
      const { createMdxLoader } = await import("./mdx/loader");
      return createMdxLoader({
        getCore: () => this.core,
      });
    },
  };
}

export type { LinkReference } from "@/collections/mdx/remark-postprocess";
export type { CompiledMDX } from "@/collections/mdx/build-mdx";
