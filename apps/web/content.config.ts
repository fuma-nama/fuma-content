import { defineMDX } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import lastModified from "fuma-content/plugins/last-modified";
import { pageSchema } from "fumadocs-core/source/schema";

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
  plugins: [lastModified()],
});
