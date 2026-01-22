import { defineConfig } from "fuma-content/config";
import { mdxCollection } from "fuma-content/collections/mdx";
import { pageSchema } from "fumadocs-core/source/schema";

export default defineConfig({
  collections: {
    docs: mdxCollection({
      dir: "content/docs",
      frontmatter: pageSchema,
    }),
  },
});
