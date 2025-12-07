import { type Collection, createCollection } from "@/config/collections";
import {
  buildFileHandler,
  type FileHandlerConfig,
} from "@/config/collections/fs";
import type { PostprocessOptions } from "@/config/collections/mdx/remark-postprocess";
import { ident } from "@/utils/codegen";
import type { Core, Plugin } from "@/core";
import type { ProcessorOptions } from "@mdx-js/mdx";
import path from "node:path";
import type { VFile } from "vfile";
import type {
  TurbopackLoaderOptions,
  TurbopackOptions,
} from "next/dist/server/config-shared";
import type { Configuration } from "webpack";
import type { WebpackLoaderOptions } from "@/webpack";
import { withLoader } from "@/plugins/with-loader";

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
}

export interface MDXCollectionConfig extends FileHandlerConfig {
  postprocess?: Partial<PostprocessOptions>;

  options?: (environment: "bundler" | "runtime") => Awaitable<ProcessorOptions>;
}

export function defineMDX(config: MDXCollectionConfig): Collection {
  return createCollection({
    init(options) {
      this.handlers.fs = buildFileHandler(options, config, ["mdx", "md"]);
      this.handlers.mdx = {
        cwd: options.workspace
          ? path.resolve(options.workspace.dir)
          : process.cwd(),
        postprocess: config.postprocess,
        getMDXOptions: config.options,
      };
    },
  });
}

export function mdxPlugin(): Plugin {
  const LinkReferenceTypes = `{
  /**
   * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
   */
  extractedReferences: import("fuma-content").ExtractedReference[];
}`;
  const mdxLoaderGlob = /\.mdx?(\?.+?)?$/;
  let core: Core;

  return withLoader(
    {
      config() {
        core = this.core;
      },
      next: {
        config(nextConfig) {
          const { configPath, outDir } = this.core.getOptions();
          const loaderOptions: WebpackLoaderOptions = {
            configPath,
            outDir,
            absoluteCompiledConfigPath: path.resolve(
              this.core.getCompiledConfigPath(),
            ),
            isDev: process.env.NODE_ENV === "development",
          };

          const turbopack: TurbopackOptions = {
            ...nextConfig.turbopack,
            rules: {
              ...nextConfig.turbopack?.rules,
              "*.{md,mdx}": {
                loaders: [
                  {
                    loader: "fuma-content/loader-mdx",
                    options: loaderOptions as unknown as TurbopackLoaderOptions,
                  },
                ],
                as: "*.js",
              },
            },
          };

          return {
            ...nextConfig,
            turbopack,
            pageExtensions: [...(nextConfig.pageExtensions ?? []), "mdx", "md"],
            webpack: (config: Configuration, options) => {
              config.resolve ||= {};
              config.module ||= {};
              config.module.rules ||= [];
              config.module.rules.push({
                test: mdxLoaderGlob,
                use: [
                  options.defaultLoaders.babel,
                  {
                    loader: "fuma-content/loader-mdx",
                    options: loaderOptions,
                  },
                ],
              });

              return nextConfig.webpack?.(config, options) ?? config;
            },
          };
        },
      },
      "index-file": {
        generateTypeConfig() {
          const lines: string[] = [];
          lines.push("{");
          lines.push("  DocData: {");
          for (const collection of this.core.getCollections()) {
            const handler = collection.handlers.mdx;
            if (!handler) continue;
            const postprocess = handler.postprocess;
            if (postprocess?.extractLinkReferences) {
              lines.push(
                ident(`${collection.name}: ${LinkReferenceTypes},`, 2),
              );
            }
          }
          lines.push("  }");
          lines.push("}");
          return lines.join("\n");
        },
        serverOptions(options) {
          options.doc ??= {};
          options.doc.passthroughs ??= [];
          options.doc.passthroughs.push("extractedReferences");
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
