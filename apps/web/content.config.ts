import { mdxCollection } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import git from "fuma-content/plugins/git";
import { mdxPreset } from "fumadocs-core/content/mdx/preset-bundler";
import { dataCollection } from "fuma-content/collections/data";

export const docs = mdxCollection({
  dir: "content/docs",
  frontmatter: pageSchema,
  postprocess: {
    extractLinkReferences: true,
    includeProcessedMarkdown: true,
  },
  options: () =>
    mdxPreset({
      rehypeCodeOptions: {
        themes: {
          light: "catppuccin-latte",
          dark: "catppuccin-mocha",
        },
      },
    }),
});

export const meta = dataCollection({
  dir: "content/docs",
  schema: metaSchema,
});

export default defineConfig({
  plugins: [git()],
});
