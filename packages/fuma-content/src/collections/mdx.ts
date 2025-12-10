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
import type { Core, Plugin } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import path from "node:path";
import type { VFile } from "vfile";
import type { TurbopackLoaderOptions } from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import type { WebpackLoaderOptions } from "@/plugins/with-loader/webpack";
import { withLoader } from "@/plugins/with-loader";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { EntryFileContext } from "@/plugins/entry-file";

type Awaitable<T> = T | Promise<T>;

interface CompilationContext {
  collection: Collection;
  filePath: string;
  source: string;
}

export interface MDXCollectionHandler {
  cwd: string;
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

  onGenerateStore?: (this: EntryFileContext, initializer: string) => string;
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
    };
    collection.handlers["last-modified"] = {
      config({ getLastModified }) {
        const mdxHandler = collection.handlers.mdx;
        if (!mdxHandler) return;

        const { onGenerateStore, vfile } = mdxHandler;
        mdxHandler.onGenerateStore = function (initializer) {
          this.codegen.addNamedImport(
            ["$lastModified"],
            "fuma-content/collections/mdx/runtime",
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
    collection.handlers["entry-file"] = {
      rerunOnFileChange: dynamic,
      async server(context) {
        const mdxHandler = collection.handlers.mdx;
        if (!collection.handlers.fs || !mdxHandler) return;
        const fsHandler = collection.handlers.fs;
        const { codegen } = context;

        function generateDocCollectionFrontmatterGlob(eager = false) {
          return codegen.generateGlobImport(fsHandler.patterns, {
            query: {
              collection: collection.name,
              only: "frontmatter",
              workspace: options.workspace?.name,
            },
            import: "frontmatter",
            base: fsHandler.dir,
            eager,
          });
        }

        function generateDocCollectionGlob(eager = false) {
          return codegen.generateGlobImport(fsHandler.patterns, {
            query: {
              collection: collection.name,
              workspace: options.workspace?.name,
            },
            base: fsHandler.dir,
            eager,
          });
        }

        const base = path.relative(process.cwd(), fsHandler.dir);
        let initializer: string;

        if (async) {
          codegen.addNamedImport(
            ["mdxStoreLazy"],
            "fuma-content/collections/mdx/runtime",
          );
          const [headGlob, bodyGlob] = await Promise.all([
            generateDocCollectionFrontmatterGlob(true),
            generateDocCollectionGlob(),
          ]);

          initializer = `mdxStoreLazy<typeof Config, "${collection.name}">("${collection.name}", "${base}", { head: ${headGlob}, body: ${bodyGlob} })`;
        } else {
          codegen.addNamedImport(
            ["mdxStore"],
            "fuma-content/collections/mdx/runtime",
          );

          initializer = `mdxStore<typeof Config, "${collection.name}">("${collection.name}", "${base}", ${await generateDocCollectionGlob(true)})`;
        }

        if (mdxHandler.postprocess?.extractLinkReferences) {
          codegen.addNamedImport(
            ["$extractedReferences"],
            "fuma-content/collections/mdx/runtime",
          );
          initializer += ".$data($extractedReferences())";
        }

        initializer =
          mdxHandler.onGenerateStore?.call(context, initializer) ?? initializer;
        codegen.push(`export const ${collection.name} = ${initializer};`);
      },
    };
  });
}

function plugin(): Plugin {
  const mdxLoaderGlob = /\.mdx?(\?.+?)?$/;

  return withLoader(
    {
      name: "mdx",
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
