import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  distDir: ".studio",
  serverExternalPackages: ["@fuma-content/studio"],
  typescript: {
    // ignore for performance
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
