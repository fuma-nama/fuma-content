import { defineMDX } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import { pageSchema } from "fumadocs-core/source/schema";
import git from "fuma-content/plugins/git";

export default defineConfig({
  collections: {
    docs: defineMDX({
      dir: "content/docs",
      frontmatter: pageSchema,
      postprocess: {
        extractLinkReferences: true,
      },
    }),
  },
  plugins: [git()],
});
