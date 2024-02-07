import { withContent } from "@fuma-content/next";

export default withContent({
  content: {
    files: ["./content/**/*.md", "./content/**/*.mdx"],
    outputDir: "./.content",
  },
});
