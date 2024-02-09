import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import grayMatter from "gray-matter";
import type { Processor } from "@mdx-js/mdx/internal-create-format-aware-processors";
import { getGitTimestamp } from "../utils/git-timpstamp";
import { remarkMdxExport } from "../remark-plugins/remark-exports";
import { remarkAbsoluteImport } from "../remark-plugins/remark-absolute-import";
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

const cache = new Map<string, Processor>();

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
  return async (file, source) => {
    const { content, data: frontmatter } = grayMatter(source);
    const detectedFormat = file.endsWith(".mdx") ? "mdx" : "md";
    const format = forceFormat ?? detectedFormat;
    let timestamp: number | undefined;
    let processor = cache.get(format);

    if (processor === undefined) {
      processor = createProcessor({
        format,
        development: process.env.NODE_ENV === "development",
        ...rest,
        remarkPlugins: [
          ...(rest.remarkPlugins ?? []),
          [remarkAbsoluteImport, { enabled: enableAbsoluteImport }],
          [remarkMdxExport, { values: remarkExports }],
        ],
      });

      cache.set(format, processor);
    }

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
      content: String(vfile),
      _mdx: {
        vfile,
      },
    };
  };
};
