import { type Collection } from "@/collections";
import type { PostprocessOptions } from "@/collections/mdx/remark-postprocess";
import type { CoreOptions, EmitCodeGeneratorContext } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import { LoaderConfig, loaderHook } from "@/plugins/loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { PreprocessOptions } from "@/collections/mdx/remark-preprocess";
import { slash } from "@/utils/code-generator";
import { validate } from "@/utils/validation";
import type { Awaitable } from "@/types";
import { asyncPipe, pipe } from "@/utils/pipe";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";
import { gitHook } from "@/plugins/git";
import path from "node:path";
import { URLSearchParams } from "node:url";

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined,
> extends Omit<FileSystemCollectionConfig, "supportedFormats"> {
  postprocess?: Partial<PostprocessOptions>;
  frontmatter?: FrontmatterSchema;
  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  lazy?: boolean;
  dynamic?: boolean;
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
    EmitCodeGeneratorContext & {
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
    this.getMDXOptions = config.options;
    this.dynamic = config.dynamic ?? false;
    this.lazy = config.lazy ?? false;
    if (config.frontmatter) {
      const frontmatter = config.frontmatter;
      // Store schema for use in studio/editors
      this.frontmatterSchema = frontmatter;
      this.frontmatter.pipe((data, { filePath }) => {
        return validate(
          frontmatter,
          data,
          undefined,
          `invalid frontmatter in ${filePath}`,
        ) as Promise<Record<string, unknown>>;
      });
    }

    if (this.postprocess?.extractLinkReferences) {
      this.storeInitializer.pipe((code, { codegen, environment }) => {
        codegen.addNamedImport(["WithExtractedReferences"], RuntimePaths[environment], true);
        code.typeParams[2] += " & WithExtractedReferences";
        return code;
      });
    }

    this.onEmit.pipe((entries, { createCodeGenerator }) => {
      return Promise.all([
        ...entries,
        createCodeGenerator(`${this.name}.ts`, (ctx) => this.generateCollectionStoreServer(ctx)),
        createCodeGenerator(`${this.name}.browser.ts`, (ctx) =>
          this.generateCollectionStoreBrowser(ctx),
        ),
        createCodeGenerator(`${this.name}.dynamic.ts`, (ctx) =>
          this.generateCollectionStoreDynamic(ctx),
        ),
      ]);
    });
    this.onServer.hook(({ core, server }) => {
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
    });

    const { loaders } = this.pluginHook(loaderHook);
    loaders.push(mdxLoader());

    this.pluginHook(gitHook).onClient.hook(({ client }) => {
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
    });
  }

  private async generateDocCollectionFrontmatterGlob(
    { workspace, codegen }: EmitCodeGeneratorContext,
    eager = false,
  ) {
    let s = `{`;
    const files = await this.getFiles();
    const query = new URLSearchParams({
      collection: this.name,
      only: "frontmatter",
    });
    if (workspace) query.set("workspace", workspace);
    for (const file of files) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query.toString()}`;
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

  private async generateDocCollectionGlob(
    { codegen, workspace }: EmitCodeGeneratorContext,
    eager = false,
  ) {
    let s = `{`;
    const files = await this.getFiles();
    const query = new URLSearchParams({
      collection: this.name,
    });
    if (workspace) query.set("workspace", workspace);
    for (const file of files) {
      const fullPath = path.join(this.dir, file);
      const specifier = `${codegen.formatImportPath(fullPath)}?${query.toString()}`;
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

  private async generateCollectionStoreServer(context: EmitCodeGeneratorContext) {
    const { core, codegen } = context;
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
      const [headGlob, bodyGlob] = await Promise.all([
        this.generateDocCollectionFrontmatterGlob(context, true),
        this.generateDocCollectionGlob(context),
      ]);

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
          await this.generateDocCollectionGlob(context, true),
        ],
      };
    }

    code = this.storeInitializer.run(code, {
      ...context,
      environment: "server",
    });
    codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
  }

  private async generateCollectionStoreBrowser(context: EmitCodeGeneratorContext) {
    const { core, codegen } = context;
    const runtimePath = RuntimePaths.browser;
    codegen.addNamedImport(["mdxStoreBrowser"], runtimePath);
    codegen.push(`export { useRenderer } from "${RuntimePaths.browser}";`);
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );

    let code: InitializerCode = {
      fn: `mdxStoreBrowser`,
      typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
      params: [`"${this.name}"`, await this.generateDocCollectionGlob(context)],
    };
    code = this.storeInitializer.run(code, {
      ...context,
      environment: "browser",
    });
    codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
  }

  private async generateCollectionStoreDynamic(context: EmitCodeGeneratorContext) {
    const { core, codegen } = context;
    const runtimePath = RuntimePaths.dynamic;
    const base = slash(core._toRuntimePath(this.dir));
    codegen.addNamespaceImport("Config", codegen.formatImportPath(core.getOptions().configPath));
    codegen.addNamedImport(["mdxStoreDynamic"], runtimePath);

    const coreOptions = core.getOptions();
    const serializableCoreOptions: CoreOptions = {
      ...coreOptions,
      configPath: core._toRuntimePath(coreOptions.configPath),
      outDir: core._toRuntimePath(coreOptions.outDir),
      cwd: core._toRuntimePath(coreOptions.cwd),
    };
    let code: InitializerCode = {
      fn: "mdxStoreDynamic",
      typeParams: ["typeof Config", `"${this.name}"`, "unknown"],
      params: [
        "Config",
        JSON.stringify(serializableCoreOptions),
        `"${this.name}"`,
        `"${base}"`,
        await this.generateDocCollectionFrontmatterGlob(context, true),
      ],
    };

    code = this.storeInitializer.run(code, {
      ...context,
      environment: "dynamic",
    });
    codegen.push(`export const ${this.name} = ${formatInitializer(code)};`);
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

export type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
export type { CompiledMDXData, CompiledMDX } from "@/collections/mdx/build-mdx";
