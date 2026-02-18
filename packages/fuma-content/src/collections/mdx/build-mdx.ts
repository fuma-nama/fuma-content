import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { remarkInclude } from "@/collections/mdx/remark-include";
import { type PostprocessOptions, remarkPostprocess } from "@/collections/mdx/remark-postprocess";
import type { Core } from "@/core";
import { createCache } from "@/utils/async-cache";
import type { MDXContent } from "mdx/types";
import { MDXCollection } from "../mdx";
import type { Pluggable, PluggableList } from "unified";
import type { Awaitable } from "@/types";

type MDXProcessor = ReturnType<typeof createProcessor>;

interface MDXCompilerContext {
  addDependency: (file: string) => void;
  collection: MDXCollection | undefined;
  core: Core;
}

interface BuildMDXOptions {
  core: Core;
  collection: MDXCollection | undefined;
  /**
   * Specify a file path for source
   */
  filePath: string;
  source: string;
  frontmatter?: Record<string, unknown>;

  environment: "bundler" | "runtime";
  isDevelopment: boolean;
  compiler: MDXCompilerContext;
}

export interface FumaContentProcessorOptions extends Omit<ProcessorOptions, "remarkPlugins"> {
  remarkPlugins?:
    | PluggableList
    | ((plugins: {
        remarkInclude: typeof remarkInclude;
        remarkPostprocess: Pluggable;
      }) => PluggableList)
    | null
    | undefined;
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
   * [Fuma Content] The internal compiler info
   */
  _compiler?: MDXCompilerContext;

  /**
   * [Fuma Content] get internal processor, do not use this on user land.
   */
  _getProcessor?: (format: "md" | "mdx") => Awaitable<MDXProcessor>;
}

declare module "vfile" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extend data map
  interface DataMap extends FumaContentDataMap {}
}

export interface CompiledMDX<Frontmatter = Record<string, unknown>> extends Record<
  string,
  unknown
> {
  frontmatter: Frontmatter;
  default: MDXContent;
}

export async function buildMDX({
  core,
  collection,
  filePath,
  frontmatter,
  source,
  compiler,
  environment,
  isDevelopment,
}: BuildMDXOptions): Promise<VFile> {
  const processorCache = createCache(core.cache).$value<MDXProcessor>();

  function getProcessor(format: "md" | "mdx") {
    const key = `build-mdx:${collection?.name ?? "global"}:${format}`;

    return processorCache.cached(key, async () => {
      const mdxOptions = await collection?.getMDXOptions?.(environment);
      const postprocessOptions: PostprocessOptions = {
        _format: format,
        ...collection?.postprocess,
      };

      return createProcessor({
        outputFormat: "program",
        development: isDevelopment,
        ...mdxOptions,
        remarkPlugins:
          typeof mdxOptions?.remarkPlugins === "function"
            ? mdxOptions.remarkPlugins({
                remarkInclude,
                remarkPostprocess: [remarkPostprocess, postprocessOptions],
              })
            : [
                remarkInclude,
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
    cwd: core.getOptions().cwd,
    data: {
      frontmatter,
      _compiler: compiler,
      _getProcessor: getProcessor,
    },
  });

  if (collection && collection) {
    vfile = await collection.vfile.run(vfile, {
      collection,
      filePath,
      source,
    });
  }

  return (await getProcessor(filePath.endsWith(".mdx") ? "mdx" : "md")).process(vfile);
}
