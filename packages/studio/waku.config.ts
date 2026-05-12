import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "waku/config";

export default defineConfig({
  unstable_adapter: "./src/adapter.ts",
  distDir: "dist/waku",
  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
      external: ["fuma-content"],
    },
  },
});
