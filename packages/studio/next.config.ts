import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  distDir: process.env.STUDIO_DIST
    ? path.relative(process.cwd(), process.env.STUDIO_DIST)
    : ".studio",
  typescript: {
    // ignore for performance
    ignoreBuildErrors: true,
    tsconfigPath: "tsconfig.build.json",
  },
  turbopack: {
    resolveAlias: {
      "virtual:content.config": process.env.STUDIO_CONFIG
        ? path.relative(process.cwd(), process.env.STUDIO_CONFIG)
        : "content.config.ts",
    },
  },
};

export default nextConfig;
