import { withContent } from "@fuma-content/next";

export default withContent({
  content: {
    files: ["./content/**/*"],
    outputDir: "./.content",
  },
  eslint: { ignoreDuringBuilds: true },
});
