import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import babel from "vite-plugin-babel";
import type { PluginOptions } from "babel-plugin-react-compiler";

const reactCompilerOptions: PluginOptions = {};

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouterRSC(),
    rsc(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", reactCompilerOptions]],
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    external: ["fuma-content", "platejs"],
  },
  optimizeDeps: {
    exclude: ["@tanstack/react-query"],
  },
});
