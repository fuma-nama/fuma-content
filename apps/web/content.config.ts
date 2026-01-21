import { defineMDX } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import { pageSchema } from "fumadocs-core/source/schema";
import git from "fuma-content/plugins/git";
import { mdxPreset } from "fumadocs-core/content/mdx/preset-bundler";
import { studio } from "@fuma-content/studio";

export const docs = defineMDX({
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

export default defineConfig({
  plugins: [git(), studio()],
});

collection().input().handlers().output();
