import { defineMDX } from "fuma-content/collections/mdx";
import { z } from "zod";
import { defineConfig } from "fuma-content/config";

export default defineConfig({
  collections: {
    docs: defineMDX({
      dir: "content/docs",
      frontmatter: z.object({
        title: z.string(),
      }),
      postprocess: {
        extractLinkReferences: true,
      },
    }),
  },
});
