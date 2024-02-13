import { withContent } from "@fuma-content/next";
import {
  rehypeCode,
  remarkHeading,
  remarkGfm,
  remarkStructure,
} from "fumadocs-core/mdx-plugins";

export default withContent({
  content: {
    files: ["./content/**/*"],
    outputDir: "./.content",
    mdxOptions: {
      remarkExports: ["frontmatter", "lastModified", "toc", "structuredData"],
      remarkPlugins: [remarkGfm, remarkHeading, remarkStructure],
      rehypePlugins: [rehypeCode],
    },
  },
  eslint: { ignoreDuringBuilds: true },
});
