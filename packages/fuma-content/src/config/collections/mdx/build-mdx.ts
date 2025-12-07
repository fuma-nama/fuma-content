import { createProcessor } from "@mdx-js/mdx";
import { VFile } from "vfile";
import {
  remarkInclude,
  type RemarkIncludeOptions,
} from "@/config/collections/mdx/remark-include";
import type { FC } from "react";
import type { MDXProps } from "mdx/types";
import {
  type PostprocessOptions,
  remarkPostprocess,
} from "@/config/collections/mdx/remark-postprocess";
import type { Core } from "@/core";
import {
  type PreprocessOptions,
  remarkPreprocess,
} from "@/config/collections/mdx/remark-preprocess";
import type { Pluggable } from "unified";
import type { Collection } from "@/config/collections";
import { createCache } from "@/utils/async-cache";

type MDXProcessor = ReturnType<typeof createProcessor>;

interface BuildMDXOptions {
  /**
   * Specify a file path for source
   */
  filePath: string;
  source: string;
  frontmatter?: Record<string, unknown>;

  environment: "bundler" | "runtime";
  isDevelopment: boolean;
  _compiler?: CompilerOptions;
  preprocess?: PreprocessOptions;
  postprocess?: PostprocessOptions;
}

export interface CompilerOptions {
  addDependency: (file: string) => void;
}

export interface CompiledMDXProperties<Frontmatter = Record<string, unknown>> {
  frontmatter: Frontmatter;
  default: FC<MDXProps>;

  /**
   * Enable from `postprocess` option.
   */
  _markdown?: string;
  /**
   * Enable from `postprocess` option.
   */
  _mdast?: string;
}

export interface FumaContentDataMap {
  /**
   * [Fuma Content] raw frontmatter, you can modify it
   */
  frontmatter?: Record<string, unknown>;

  /**
   * [Fuma Content] additional ESM exports to write
   */
  "mdx-export"?: { name: string; value: unknown }[];

  /**
   * [Fuma Content] The compiler object from loader
   */
  _compiler?: CompilerOptions;

  /**
   * [Fuma Content] get internal processor, do not use this on user land.
   */
  _getProcessor?: (
    format: "md" | "mdx",
  ) => MDXProcessor | Promise<MDXProcessor>;
}

declare module "vfile" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extend data map
  interface DataMap extends FumaContentDataMap {}
}

export async function buildMDX(
  core: Core,
  collection: Collection | undefined,
  {
    filePath,
    frontmatter,
    source,
    _compiler,
    environment,
    isDevelopment,
    postprocess,
    preprocess,
  }: BuildMDXOptions,
): Promise<VFile> {
  const handler = collection?.handlers.mdx;
  const processorCache = createCache(core.cache as Map<string, MDXProcessor>);

  function getProcessor(format: "md" | "mdx") {
    const key = `build-mdx:${collection?.name ?? "global"}:${format}`;

    return processorCache.cached(key, async () => {
      const mdxOptions = await handler?.getMDXOptions?.(environment);
      const preprocessPlugin = [
        remarkPreprocess,
        preprocess,
      ] satisfies Pluggable;
      const postprocessOptions: PostprocessOptions = {
        _format: format,
        ...postprocess,
      };
      const remarkIncludeOptions: RemarkIncludeOptions = {
        preprocess: [preprocessPlugin],
      };

      return createProcessor({
        outputFormat: "program",
        development: isDevelopment,
        ...mdxOptions,
        remarkPlugins: [
          preprocessPlugin,
          [remarkInclude, remarkIncludeOptions],
          ...(mdxOptions?.remarkPlugins ?? []),
          [remarkPostprocess, postprocessOptions],
        ],
        format,
      });
    });
  }

  let vfile = new VFile({
    value: source,
    path: filePath,
    cwd: handler?.cwd,
    data: {
      frontmatter,
      _compiler,
      _getProcessor: getProcessor,
      _preprocessor: preprocess?.preprocessor,
    },
  });

  if (collection && handler?.vfile) {
    vfile = await handler.vfile.call(
      {
        collection,
        filePath,
        source,
      },
      vfile,
    );
  }

  return (await getProcessor(filePath.endsWith(".mdx") ? "mdx" : "md")).process(
    vfile,
  );
}
