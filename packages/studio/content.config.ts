import { mdxCollection } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import git from "fuma-content/plugins/git";
import z from "zod";

export const docs = mdxCollection({
  dir: "content/docs",
  frontmatter: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
  postprocess: {
    extractLinkReferences: true,
    includeProcessedMarkdown: true,
  },
});

export default defineConfig({
  plugins: [git()],
});
