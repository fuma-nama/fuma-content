import { type Collection, type CollectionTypeInfo, createCollection } from "@/collections";
import { type FileHandlerConfig, initFileCollection } from "@/collections/handlers/fs";
import type { PostprocessOptions } from "@/collections/mdx/remark-postprocess";
import type { CoreOptions, EmitCodeGeneratorContext, Plugin } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import path from "node:path";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";
import { withLoader } from "@/plugins/with-loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { PreprocessOptions } from "@/collections/mdx/remark-preprocess";
import { slash } from "@/utils/code-generator";
import { validate } from "@/utils/validation";
import type { Awaitable } from "@/types";
import { type AsyncPipe, asyncPipe, type Pipe, pipe } from "@/utils/pipe";

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionHandler {
  readonly cwd: string;
  readonly dynamic: boolean;
  readonly lazy: boolean;

  preprocess?: PreprocessOptions;
  postprocess?: Partial<PostprocessOptions>;
  getMDXOptions?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;

  /**
   * Transform & validate frontmatter
   */
  frontmatter: AsyncPipe<Record<string, unknown> | undefined, CompilationContext>;

  /**
   * Transform `vfile` on compilation stage
   */
  vfile: AsyncPipe<VFile, CompilationContext>;

  /**
   * Transform the initializer code (TypeScript) for collection store
   */
  storeInitializer: Pipe<
    string,
    EmitCodeGeneratorContext & {
      environment: "browser" | "server" | "dynamic";
    }
  >;
}

export interface MDXCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
> extends FileHandlerConfig {
  postprocess?: Partial<PostprocessOptions>;
  frontmatter?: FrontmatterSchema;
  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  lazy?: boolean;
  dynamic?: boolean;
}

export interface MDXCollection<Frontmatter> extends Collection {
  _frontmatter?: Frontmatter;
}

const mdxTypeInfo: CollectionTypeInfo = {
  id: "mdx",
  plugins: [plugin()],
};

const RuntimePaths = {
  browser: "fuma-content/collections/mdx/runtime-browser",
  dynamic: "fuma-content/collections/mdx/runtime-dynamic",
  server: "fuma-content/collections/mdx/runtime",
};

export function defineMDX<FrontmatterSchema extends StandardSchemaV1 | undefined = undefined>(
  config: MDXCollectionConfig<FrontmatterSchema>,
): MDXCollection<
  FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown>
> {
  const { lazy = false, dynamic = false } = config;
  return createCollection(mdxTypeInfo, (collection, options) => {
    initFileCollection(collection, options, {
      supportedFormats: ["mdx", "md"],
      ...config,
    });
    const mdxHandler = (collection.handlers.mdx = {
      cwd: options.workspace ? path.resolve(options.workspace.dir) : process.cwd(),
      postprocess: config.postprocess,
      getMDXOptions: config.options,
      dynamic,
      lazy: lazy,
      vfile: asyncPipe(),
      frontmatter: asyncPipe(),
      storeInitializer: pipe(),
    });

    if (config.frontmatter) {
      const frontmatter = config.frontmatter;
      mdxHandler.frontmatter.pipe((data, { filePath }) => {
        return validate(
          frontmatter,
          data,
          undefined,
          `invalid frontmatter in ${filePath}`,
        ) as Promise<Record<string, unknown>>;
      });
    }

    if (mdxHandler.postprocess?.extractLinkReferences) {
      mdxHandler.storeInitializer.pipe((initializer, { codegen, environment }) => {
        codegen.addNamedImport(["$extractedReferences"], RuntimePaths[environment]);
        return `${initializer}.$data($extractedReferences())`;
      });
    }

    collection.handlers["version-control"] = {
      client({ client }) {
        const mdxHandler = collection.handlers.mdx;
        if (!mdxHandler) return;

        mdxHandler.storeInitializer.pipe((initializer, { codegen, environment }) => {
          codegen.addNamedImport(["$versionControl"], RuntimePaths[environment]);
          return `${initializer}.$data($versionControl())`;
        });

        mdxHandler.vfile.pipe(async (file) => {
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
      },
    };
  });
}

function plugin(): Plugin {
  const mdxLoaderGlob = /\.mdx?(\?.+?)?$/;

  function generateDocCollectionFrontmatterGlob(
    context: EmitCodeGeneratorContext,
    collection: Collection,
    eager = false,
  ) {
    const handler = collection.handlers.fs;
    if (!handler) return "";
    return context.codegen.generateGlobImport(handler.patterns, {
      query: {
        collection: collection.name,
        only: "frontmatter",
        workspace: context.workspace,
      },
      import: "frontmatter",
      base: handler.dir,
      eager,
    });
  }

  function generateDocCollectionGlob(
    context: EmitCodeGeneratorContext,
    collection: Collection,
    eager = false,
  ) {
    const handler = collection.handlers.fs;
    if (!handler) return "";
    return context.codegen.generateGlobImport(handler.patterns, {
      query: {
        collection: collection.name,
        workspace: context.workspace,
      },
      base: handler.dir,
      eager,
    });
  }

  async function generateCollectionStoreServer(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const mdxHandler = collection.handlers.mdx;
    const fsHandler = collection.handlers.fs;
    if (!fsHandler || !mdxHandler) return;
    const { core, codegen } = context;
    const runtimePath = RuntimePaths.server;
    const base = slash(path.relative(process.cwd(), fsHandler.dir));
    let initializer: string;
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );

    if (mdxHandler.lazy) {
      codegen.addNamedImport(["mdxStoreLazy"], runtimePath);
      const [headGlob, bodyGlob] = await Promise.all([
        generateDocCollectionFrontmatterGlob(context, collection, true),
        generateDocCollectionGlob(context, collection),
      ]);

      initializer = `mdxStoreLazy<typeof Config, "${collection.name}">("${collection.name}", "${base}", { head: ${headGlob}, body: ${bodyGlob} })`;
    } else {
      codegen.addNamedImport(["mdxStore"], runtimePath);
      initializer = `mdxStore<typeof Config, "${collection.name}">("${collection.name}", "${base}", ${await generateDocCollectionGlob(context, collection, true)})`;
    }

    initializer = mdxHandler.storeInitializer.run(initializer, {
      ...context,
      environment: "server",
    });
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  async function generateCollectionStoreBrowser(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const mdxHandler = collection.handlers.mdx;
    const fsHandler = collection.handlers.fs;
    if (!fsHandler || !mdxHandler) return;
    const { core, codegen } = context;
    const runtimePath = RuntimePaths.browser;
    codegen.addNamedImport(["mdxStoreBrowser"], runtimePath);
    codegen.addNamespaceImport(
      "Config",
      codegen.formatImportPath(core.getOptions().configPath),
      true,
    );

    let initializer = `mdxStoreBrowser<typeof Config, "${collection.name}">("${collection.name}", ${await generateDocCollectionGlob(context, collection)})`;

    initializer = mdxHandler.storeInitializer.run(initializer, {
      ...context,
      environment: "browser",
    });
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  async function generateCollectionStoreDynamic(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const mdxHandler = collection.handlers.mdx;
    const fsHandler = collection.handlers.fs;
    if (!fsHandler || !mdxHandler || !mdxHandler.dynamic) return;
    const { core, codegen } = context;
    const { configPath, workspace, outDir } = core.getOptions();
    const runtimePath = RuntimePaths.dynamic;
    const base = slash(path.relative(process.cwd(), fsHandler.dir));
    codegen.addNamespaceImport("Config", codegen.formatImportPath(core.getOptions().configPath));
    codegen.addNamedImport(["mdxStoreDynamic"], runtimePath);

    const coreOptions: CoreOptions = {
      configPath,
      workspace,
      outDir,
    };
    let initializer = `mdxStoreDynamic<typeof Config, "${collection.name}">(Config, ${JSON.stringify(
      coreOptions,
    )}, "${collection.name}", "${base}", ${await generateDocCollectionFrontmatterGlob(context, collection, true)})`;

    initializer = mdxHandler.storeInitializer.run(initializer, {
      ...context,
      environment: "dynamic",
    });
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  const base: Plugin = {
    name: "mdx",
    configureServer(server) {
      if (!server.watcher) return;

      server.watcher.on("all", async (event, file) => {
        const updatedCollection = this.core.getCollections().find((collection) => {
          const handlers = collection.handlers;
          if (!handlers.mdx || !handlers.fs) return false;
          if (event === "change" && !handlers.mdx.dynamic) return false;
          return handlers.fs.hasFile(file);
        });

        if (!updatedCollection) return;
        await this.core.emit({
          filterPlugin: (plugin) => plugin.name === base.name,
          filterWorkspace: () => false,
          write: true,
        });
      });
    },
    emit() {
      return Promise.all([
        this.createCodeGenerator("mdx.ts", async (ctx) => {
          for (const collection of this.core.getCollections()) {
            await generateCollectionStoreServer(ctx, collection);
          }
        }),

        this.createCodeGenerator("mdx-browser.ts", async (ctx) => {
          for (const collection of this.core.getCollections()) {
            await generateCollectionStoreBrowser(ctx, collection);
          }

          ctx.codegen.push(`export { useRenderer } from "${RuntimePaths.browser}";`);
        }),

        this.createCodeGenerator("mdx-dynamic.ts", async (ctx) => {
          for (const collection of this.core.getCollections()) {
            await generateCollectionStoreDynamic(ctx, collection);
          }
        }),
      ]);
    },
    next: {
      config(nextConfig) {
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
          pageExtensions: [
            ...(nextConfig.pageExtensions ?? ["js", "jsx", "tsx", "ts"]),
            "mdx",
            "md",
          ],
          webpack(config: Configuration, options) {
            config.module ||= {};
            config.module.rules ||= [];
            config.module.rules.push({
              test: mdxLoaderGlob,
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
    },
  };

  return withLoader(base, {
    test: mdxLoaderGlob,
    async createLoader() {
      const { createMdxLoader } = await import("./mdx/loader");
      return createMdxLoader({
        getCore: () => this.core,
      });
    },
  });
}

export type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
export type { CompiledMDXData, CompiledMDX } from "@/collections/mdx/build-mdx";
