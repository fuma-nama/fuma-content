import { createProcessor, type ProcessorOptions } from "@mdx-js/mdx";
import grayMatter from "gray-matter";
import type {
  Processor,
  VFile,
} from "@mdx-js/mdx/internal-create-format-aware-processors";
import { getGitTimestamp } from "../utils/git-timpstamp";
import { remarkMdxExport } from "../remark-plugins/remark-exports";

export interface Options extends ProcessorOptions {
  /**
   * Fetch last modified time with specified version control
   * @defaultValue 'none'
   */
  lastModifiedTime?: "git" | "none";

  /**
   * @defaultValue `['frontmatter']`
   */
  remarkExports?: string[];
}

const cache = new Map<string, Processor>();

/**
 * Load MDX/markdown files
 */
export async function loadMDX(
  filePath: string,
  source: string,
  {
    lastModifiedTime,
    format: forceFormat,
    remarkExports = ["frontmatter"],
    ...rest
  }: Options
): Promise<{ content: string; file: VFile }> {
  const { content, data: frontmatter } = grayMatter(source);
  const detectedFormat = filePath.endsWith(".mdx") ? "mdx" : "md";
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
        [remarkMdxExport, { values: remarkExports }],
      ],
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
