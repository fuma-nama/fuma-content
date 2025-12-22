import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  serverExternalPackages: ["fuma-content"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
