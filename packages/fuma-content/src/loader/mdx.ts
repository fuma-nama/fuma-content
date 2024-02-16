import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import grayMatter from "gray-matter";
import type { Processor } from "@mdx-js/mdx/internal-create-format-aware-processors";
import type { Pluggable } from "unified";
import { getGitTimestamp } from "../utils/git-timpstamp";
import { remarkMdxExport } from "../remark-plugins/remark-exports";
import * as remarkAbsoluteImport from "../remark-plugins/remark-absolute-import";
import type { Compiler } from "../compiler/types";
import type { Transformer } from "./types";

export interface Options extends ProcessorOptions {
  /**
   * Fetch last modified time with specified version control
   * @defaultValue 'none'
   */
  lastModifiedTime?: "git" | "none";

  /**
   * @defaultValue `['frontmatter', 'lastModified']`
   */
  remarkExports?: string[];

  /**
   * Convert relative imports into absolute imports
   *
   * @defaultValue true
   */
  enableAbsoluteImport?: boolean;
}

interface CompilerWithCache extends Compiler {
  _mdxCache?: Map<string, Processor>;
}

function pluggable(enable: boolean, value: Pluggable): Pluggable[] {
  return enable ? [value] : [];
}

function getProcessor(
  compiler: CompilerWithCache,
  options: ProcessorOptions
): Processor {
  if (!options.format) throw new Error("format is required");
  compiler._mdxCache ||= new Map();

  let processor = compiler._mdxCache.get(options.format);

  if (!processor) {
    processor = createProcessor(options);

    compiler._mdxCache.set(options.format, processor);
  }

  return processor;
}

/**
 * Load MDX/markdown files
 */
export const loadMDX = ({
  lastModifiedTime,
  format: forceFormat,
  remarkExports = ["frontmatter", "lastModified"],
  enableAbsoluteImport = true,
  ...rest
}: Options = {}): Transformer => {
  return async function transform(file, source) {
    const { content, data: frontmatter } = grayMatter(source);
    const detectedFormat = file.endsWith(".mdx") ? "mdx" : "md";
    const format = forceFormat ?? detectedFormat;
    let timestamp: number | undefined;

    const processor = getProcessor(this, {
      format,
      development: process.env.NODE_ENV === "development",
      ...rest,
      remarkPlugins: [
        ...(rest.remarkPlugins ?? []),
        ...pluggable(enableAbsoluteImport, [
          remarkAbsoluteImport.remarkAbsoluteImport,
          {
            compiler: this,
            transformFormats: Object.keys(this.loaders),
          } satisfies remarkAbsoluteImport.Options,
        ]),
        [remarkMdxExport, { values: remarkExports }],
      ],
    });

    if (lastModifiedTime === "git")
      timestamp = (await getGitTimestamp(file))?.getTime();

    const vfile = await processor.process({
      value: content,
      path: file,
      data: {
        lastModified: timestamp,
        frontmatter,
      },
    });

    return {
      dependencies: (vfile.data.ctx as remarkAbsoluteImport.Context)
        .dependencies,
      content: String(vfile),
      _mdx: {
        vfile,
      },
    };
  };
};
