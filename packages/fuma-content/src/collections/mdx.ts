import { type Collection, createCollection } from "@/collections";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/collections/file-list";
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
import { CollectionListGenerator } from "@/collections/list";
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

  onGenerateList?: (
    this: EntryFileContext,
    gen: CollectionListGenerator,
  ) => Awaitable<void>;
}

export interface MDXCollectionConfig extends FileHandlerConfig {
  postprocess?: Partial<PostprocessOptions>;
  frontmatter?: StandardSchemaV1;
  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
  async?: boolean;
}

export type MDXCollection<_Config extends MDXCollectionConfig> = Collection & {
  _?: _Config;
};

export function defineMDX<C extends MDXCollectionConfig>(
  config: C,
): MDXCollection<C> {
  const { async = false } = config;
  return createCollection((collection, options) => {
    collection.handlers.fs = buildFileHandler(options, config, ["mdx", "md"]);
    collection.handlers.mdx = {
      cwd: options.workspace
        ? path.resolve(options.workspace.dir)
        : process.cwd(),
      postprocess: config.postprocess,
      getMDXOptions: config.options,
      onGenerateList(list) {
        const mdxHandler = collection.handlers.mdx;
        if (!mdxHandler) return;

        if (mdxHandler.postprocess?.extractLinkReferences) {
          this.codegen.addNamedImport(
            ["composerExtractedReferences"],
            "fuma-content/collections/mdx/runtime",
          );
          list.composer("composerExtractedReferences()");
        }
      },
    };
    collection.handlers["last-modified"] = {
      config({ getLastModified }) {
        const mdxHandler = collection.handlers.mdx;
        if (!mdxHandler) return;

        const { onGenerateList, vfile } = mdxHandler;
        mdxHandler.onGenerateList = function (list) {
          this.codegen.addNamedImport(
            ["composerLastModified"],
            "fuma-content/plugins/last-modified/runtime",
          );
          list.composer("composerLastModified()");
          return onGenerateList?.call(this, list);
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
      async generate(context) {
        if (!collection.handlers.fs) return;
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
            ["mdxListLazy"],
            "fuma-content/collections/mdx/runtime",
          );
          const [headGlob, bodyGlob] = await Promise.all([
            generateDocCollectionFrontmatterGlob(true),
            generateDocCollectionGlob(),
          ]);

          initializer = `mdxListLazy<typeof Config, "${collection.name}">("${collection.name}", "${base}", { head: ${headGlob}, body: ${bodyGlob} })`;
        } else {
          codegen.addNamedImport(
            ["mdxList"],
            "fuma-content/collections/mdx/runtime",
          );

          initializer = `mdxList<typeof Config, "${collection.name}">("${collection.name}", "${base}", ${await generateDocCollectionGlob(true)})`;
        }

        const list = new CollectionListGenerator(initializer);
        collection.handlers.mdx?.onGenerateList?.call(context, list);
        codegen.push(`export const ${collection.name} = ${list.flush()};`);
      },
    };
  });
}

export function mdxPlugin(): Plugin {
  const mdxLoaderGlob = /\.mdx?(\?.+?)?$/;
  let core: Core;

  return withLoader(
    {
      name: "mdx",
      config() {
        core = this.core;
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
              ...(nextConfig.pageExtensions ?? []),
              "js",
              "jsx",
              "tsx",
              "mdx",
              "md",
            ],
            webpack: (config: Configuration, options) => {
              config.resolve ||= {};
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
      createLoader: () =>
        import("./mdx/loader").then((mod) =>
          mod.createMdxLoader({
            getCore: () => core,
          }),
        ),
    },
  );
}
