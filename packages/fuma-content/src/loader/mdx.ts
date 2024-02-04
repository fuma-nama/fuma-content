import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import type { Processor } from "@mdx-js/mdx/lib/core";
import grayMatter from "gray-matter";
import { getGitTimestamp } from "../utils/git-timpstamp";
import type { VFile } from "@mdx-js/mdx/lib/compile";

export interface Options extends ProcessorOptions {
  /**
   * Fetch last modified time with specified version control
   * @defaultValue 'none'
   */
  lastModifiedTime?: "git" | "none";
}

const cache = new Map<string, Processor>();

/**
 * Load MDX/markdown files
 */
export default async function loadMDX(
  filePath: string,
  source: string,
  { lastModifiedTime, ...options }: Options
): Promise<{ content: string; file: VFile }> {
  const { content, data: frontmatter } = grayMatter(source);
  const detectedFormat = filePath.endsWith(".mdx") ? "mdx" : "md";
  const format = options.format ?? detectedFormat;
  let timestamp: number | undefined;
  let processor = cache.get(format);

  if (processor === undefined) {
    processor = createProcessor({
      ...options,
      development: this.mode === "development",
      format,
    });

    cache.set(format, processor);
  }

  if (lastModifiedTime === "git")
    timestamp = (await getGitTimestamp(filePath))?.getTime();

  const file = await processor.process({
    value: content,
    path: filePath,
    data: {
      lastModified: timestamp,
      frontmatter,
    },
  });

  return {
    content: String(file),
    file,
  };
}
