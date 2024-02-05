import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import grayMatter from "gray-matter";
import type {
  Processor,
  VFile,
} from "@mdx-js/mdx/internal-create-format-aware-processors";
import { getGitTimestamp } from "../utils/git-timpstamp";

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
export async function loadMDX(
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
      development: process.env.NODE_ENV === "development",
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
