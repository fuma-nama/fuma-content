import {
  type Collection,
  type CollectionTypeInfo,
  createCollection,
} from "@/collections";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/collections/handlers/fs";
import type { PostprocessOptions } from "@/collections/mdx/remark-postprocess";
import type { EmitCodeGeneratorContext, Plugin } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import path from "node:path";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";
import { withLoader } from "@/plugins/with-loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type Awaitable<T> = T | Promise<T>;

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionHandler {
  readonly cwd: string;
  readonly dynamic: boolean;
  readonly async: boolean;

  postprocess?: Partial<PostprocessOptions>;
  getMDXOptions?: (
    environment: "bundler" | "runtime",
  ) => Awaitable<ProcessorOptions>;

  /**
   * Transform frontmatter
   */
  frontmatter?: (
    this: CompilationContext,
    data: Record<string, unknown>,
  ) => Awaitable<Record<string, unknown> | undefined>;

  /**
   * Transform `vfile` on compilation stage
   */
  vfile?: (this: CompilationContext, file: VFile) => Awaitable<VFile>;

  onGenerateStore?: (
    this: EmitCodeGeneratorContext & { environment: "browser" | "server" },
    initializer: string,
  ) => string;
}

export interface MDXCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
> extends FileHandlerConfig {
  postprocess?: Partial<PostprocessOptions>;
  frontmatter?: FrontmatterSchema;
  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  async?: boolean;
  dynamic?: boolean;
}

export type MDXCollection<Frontmatter> = Collection & {
  _frontmatter?: Frontmatter;
};

const mdxTypeInfo: CollectionTypeInfo = {
  id: "mdx",
  plugins: [plugin()],
};

const RuntimePaths = {
  browser: "fuma-content/collections/mdx/runtime-browser",
  server: "fuma-content/collections/mdx/runtime",
};

export function defineMDX<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
>(
  config: MDXCollectionConfig<FrontmatterSchema>,
): MDXCollection<
  FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown>
> {
  const { async = false, dynamic = false } = config;
  return createCollection(mdxTypeInfo, (collection, options) => {
    collection.handlers.fs = buildFileHandler(options, config, ["mdx", "md"]);
    collection.handlers.mdx = {
      cwd: options.workspace
        ? path.resolve(options.workspace.dir)
        : process.cwd(),
      postprocess: config.postprocess,
      getMDXOptions: config.options,
      dynamic,
      async,
    };
    collection.handlers["last-modified"] = {
      config({ getLastModified }) {
        const mdxHandler = collection.handlers.mdx;
        if (!mdxHandler) return;

        const { onGenerateStore, vfile } = mdxHandler;
        mdxHandler.onGenerateStore = function (initializer) {
          this.codegen.addNamedImport(
            ["$lastModified"],
            RuntimePaths[this.environment],
          );
          initializer += ".$data($lastModified())";
          return onGenerateStore?.call(this, initializer) ?? initializer;
        };

        mdxHandler.vfile = async function (file) {
          const timestamp = await getLastModified(file.path);
          if (timestamp) {
            file.data["mdx-export"] ??= [];
            file.data["mdx-export"].push({
              name: "lastModified",
              value: timestamp,
            });
          }
          if (vfile) return vfile?.call(this, file);
          return file;
        };
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
    const { codegen } = context;
    const runtimePath = RuntimePaths.server;
    const base = path.relative(process.cwd(), fsHandler.dir);
    let initializer: string;

    if (mdxHandler.async) {
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

    if (mdxHandler.postprocess?.extractLinkReferences) {
      codegen.addNamedImport(["$extractedReferences"], runtimePath);
      initializer += ".$data($extractedReferences())";
    }

    initializer =
      mdxHandler.onGenerateStore?.call(
        { ...context, environment: "server" },
        initializer,
      ) ?? initializer;
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  async function generateCollectionStoreBrowser(
    context: EmitCodeGeneratorContext,
    collection: Collection,
  ) {
    const mdxHandler = collection.handlers.mdx;
    const fsHandler = collection.handlers.fs;
    if (!fsHandler || !mdxHandler) return;
    const { codegen } = context;
    const runtimePath = RuntimePaths.browser;
    codegen.addNamedImport(["mdxStoreBrowser"], runtimePath);
    let initializer = `mdxStoreBrowser<typeof Config, "${collection.name}">("${collection.name}", ${await generateDocCollectionGlob(context, collection)})`;

    if (mdxHandler.postprocess?.extractLinkReferences) {
      codegen.addNamedImport(["$extractedReferences"], runtimePath);
      initializer += ".$data($extractedReferences())";
    }

    initializer =
      mdxHandler.onGenerateStore?.call(
        { ...context, environment: "browser" },
        initializer,
      ) ?? initializer;
    codegen.push(`export const ${collection.name} = ${initializer};`);
  }

  return withLoader(
    {
      name: "mdx",
      configureServer(server) {
        if (!server.watcher) return;

        server.watcher.on("all", async (event, file) => {
          const updatedCollection = this.core
            .getCollections()
            .find((collection) => {
              const handlers = collection.handlers;
              if (!handlers.mdx || !handlers.fs) return false;
              if (event === "change" && !handlers.mdx.dynamic) return false;
              return handlers.fs.hasFile(file);
            });

          if (!updatedCollection) return;
          await this.core.emit({
            filterPlugin: (plugin) => plugin.name === "mdx",
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
                "*.{md,mdx}": {
                  loaders: [
                    {
                      loader: loaderPath,
                      options:
                        loaderOptions as unknown as TurbopackLoaderOptions,
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
    },
    {
      test: mdxLoaderGlob,
      async createLoader() {
        const { createMdxLoader } = await import("./mdx/loader");
        return createMdxLoader({
          getCore: () => this.core,
        });
      },
    },
  );
}
