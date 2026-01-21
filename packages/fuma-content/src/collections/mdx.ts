import { type Collection } from "@/collections";
import type { PostprocessOptions } from "@/collections/mdx/remark-postprocess";
import type { CoreOptions, EmitCodeGeneratorContext } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import path from "node:path";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";
import { LoaderConfig, loaderHook } from "@/plugins/with-loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { PreprocessOptions } from "@/collections/mdx/remark-preprocess";
import { slash } from "@/utils/code-generator";
import { validate } from "@/utils/validation";
import type { Awaitable } from "@/types";
import { asyncPipe, pipe } from "@/utils/pipe";
import { FileSystemCollection, FileSystemCollectionConfig } from "./fs";

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
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

export class MDXCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
> extends FileSystemCollection {
  readonly dynamic: boolean;
  readonly lazy: boolean;
  readonly preprocess?: PreprocessOptions;
  readonly postprocess?: Partial<PostprocessOptions>;
  readonly getMDXOptions?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  /**
   * Frontmatter schema (if defined)
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
   * Transform the initializer code (TypeScript) for collection store
   */
  storeInitializer = pipe<
    string,
    EmitCodeGeneratorContext & {
      environment: "browser" | "server" | "dynamic";
    }
  >();

  $inferFrontmatter?: FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown>;

  constructor(config: MDXCollectionConfig) {
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
      this.storeInitializer.pipe((initializer, { codegen, environment }) => {
        codegen.addNamedImport(["$extractedReferences"], RuntimePaths[environment]);
        return `${initializer}.$data($extractedReferences())`;
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
    this.onServer.pipe(({ core, server }) => {
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
  }

  private generateDocCollectionFrontmatterGlob(context: EmitCodeGeneratorContext, eager = false) {
    return context.codegen.generateGlobImport(this.patterns, {
      query: {
        collection: this.name,
        only: "frontmatter",
        workspace: context.workspace,
      },
      import: "frontmatter",
      base: this.dir,
      eager,
    });
  }

  private generateDocCollectionGlob(context: EmitCodeGeneratorContext, eager = false) {
    return context.codegen.generateGlobImport(this.patterns, {
      query: {
        collection: this.name,
        workspace: context.workspace,
      },
      base: this.dir,
      eager,
    });
  }

  private async generateCollectionStoreServer(context: EmitCodeGeneratorContext) {
    const { core, codegen } = context;
    const runtimePath = RuntimePaths.server;
    const base = slash(core._toRuntimePath(this.dir));
    let initializer: string;
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

      initializer = `mdxStoreLazy<typeof Config, "${this.name}">("${this.name}", "${base}", { head: ${headGlob}, body: ${bodyGlob} })`;
    } else {
      codegen.addNamedImport(["mdxStore"], runtimePath);
      initializer = `mdxStore<typeof Config, "${this.name}">("${this.name}", "${base}", ${await this.generateDocCollectionGlob(context, true)})`;
    }

    initializer = this.storeInitializer.run(initializer, {
      ...context,
      environment: "server",
    });
    codegen.push(`export const ${this.name} = ${initializer};`);
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

    let initializer = `mdxStoreBrowser<typeof Config, "${this.name}">("${this.name}", ${await this.generateDocCollectionGlob(context)})`;

    initializer = this.storeInitializer.run(initializer, {
      ...context,
      environment: "browser",
    });
    codegen.push(`export const ${this.name} = ${initializer};`);
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
    let initializer = `mdxStoreDynamic<typeof Config, "${this.name}">(Config, ${JSON.stringify(
      serializableCoreOptions,
    )}, "${this.name}", "${base}", ${await this.generateDocCollectionFrontmatterGlob(context, true)})`;

    initializer = this.storeInitializer.run(initializer, {
      ...context,
      environment: "dynamic",
    });
    codegen.push(`export const ${this.name} = ${initializer};`);
  }
}

function mdxLoader(): LoaderConfig {
  const test = /\.mdx?(\?.+?)?$/;

  return {
    id: "mdx",
    test,
    configureNext(nextConfig) {
      const { configPath, outDir } = this.core.getOptions();
      const loaderPath = "fuma-content/collections/mdx/loader-webpack";
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
