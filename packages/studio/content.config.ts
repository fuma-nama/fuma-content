import { defineMDX } from "fuma-content/collections/mdx";
import { defineConfig } from "fuma-content/config";
import git from "fuma-content/plugins/git";

export const docs = defineMDX({
  dir: "content/docs",
  postprocess: {
    extractLinkReferences: true,
    includeProcessedMarkdown: true,
  },
});

export default defineConfig({
  plugins: [git()],
});
