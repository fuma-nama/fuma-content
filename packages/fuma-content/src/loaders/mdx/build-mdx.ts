import { createProcessor } from "@mdx-js/mdx";
import { VFile } from "vfile";
import {
  remarkInclude,
  type RemarkIncludeOptions,
} from "@/loaders/mdx/remark-include";
import type { FC } from "react";
import type { MDXProps } from "mdx/types";
import {
  type PostprocessOptions,
  remarkPostprocess,
} from "@/loaders/mdx/remark-postprocess";
import type { Core } from "@/core";
import type { DocCollectionItem } from "@/config/build";
import {
  type PreprocessOptions,
  remarkPreprocess,
} from "@/loaders/mdx/remark-preprocess";
import type { Pluggable } from "unified";

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
  _getProcessor?: (format: "md" | "mdx") => MDXProcessor;
}

declare module "vfile" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extend data map
  interface DataMap extends FumaContentDataMap {}
}

export async function buildMDX(
  core: Core,
  collection: DocCollectionItem | undefined,
  {
    filePath,
    frontmatter,
    source,
    _compiler,
    environment,
    isDevelopment,
    preprocess,
  }: BuildMDXOptions,
): Promise<VFile> {
  const mdxOptions = await core
    .getConfig()
    .getMDXOptions(collection, environment);

  function getProcessor(format: "md" | "mdx") {
    const cache = core.cache as Map<string, MDXProcessor>;
    const key = `build-mdx:${collection?.name ?? "global"}:${format}`;
    let processor = cache.get(key);

    if (!processor) {
      const preprocessPlugin = [
        remarkPreprocess,
        preprocess,
      ] satisfies Pluggable;
      const postprocessOptions: PostprocessOptions = {
        _format: format,
        ...collection?.postprocess,
      };
      const remarkIncludeOptions: RemarkIncludeOptions = {
        preprocess: [preprocessPlugin],
      };

      processor = createProcessor({
        outputFormat: "program",
        development: isDevelopment,
        ...mdxOptions,
        remarkPlugins: [
          preprocessPlugin,
          [remarkInclude, remarkIncludeOptions],
          ...(mdxOptions.remarkPlugins ?? []),
          [remarkPostprocess, postprocessOptions],
        ],
        format,
      });

      cache.set(key, processor);
    }

    return processor;
  }

  let vfile = new VFile({
    value: source,
    path: filePath,
    cwd: collection?.cwd,
    data: {
      frontmatter,
      _compiler,
      _getProcessor: getProcessor,
      _preprocessor: preprocess?.preprocessor,
    },
  });

  if (collection) {
    vfile = await core.transformVFile({ collection, filePath, source }, vfile);
  }

  return getProcessor(filePath.endsWith(".mdx") ? "mdx" : "md").process(vfile);
}
