import { defineMDX } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import { pageSchema } from "fumadocs-core/source/schema";
import git from "fuma-content/plugins/git";
import {
  remarkGfm,
  rehypeCode,
  rehypeToc,
  remarkCodeTab,
  remarkHeading,
} from "fumadocs-core/mdx-plugins";

export default defineConfig({
  collections: {
    docs: defineMDX({
      dir: "content/docs",
      frontmatter: pageSchema,
      postprocess: {
        extractLinkReferences: true,
      },
      options: () => ({
        remarkPlugins: [remarkGfm, remarkHeading, remarkCodeTab],
        rehypePlugins: [rehypeCode, rehypeToc],
      }),
    }),
  },
  plugins: [git()],
});
