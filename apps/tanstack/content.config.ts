import { defineConfig } from "fuma-content/config";
import { defineMDX } from "fuma-content/collections/mdx";
import { pageSchema } from "fumadocs-core/source/schema";

export default defineConfig({
  collections: {
    docs: defineMDX({
      dir: "content/docs",
      frontmatter: pageSchema,
    }),
  },
});
