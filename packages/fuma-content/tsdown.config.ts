import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

export default defineConfig({
  entry: [
    "./src/{index,dynamic,bin}.ts",
    "./src/{config,node,next,vite,bun}/index.ts",
    "./src/node/loader.ts",

    "./src/collections/*.ts",
    "./src/collections/**/{loader-webpack,runtime,runtime-*}.ts",

    "./src/collections/runtime/*.ts",
    "./src/collections/mdx/react.ts",
    "./src/collections/mdx/vue.ts",

    "./src/plugins/*.ts",
    "./src/plugins/remark/*.ts",
    "./src/plugins/loader/{index,webpack}.ts",
  ],
  format: "esm",
  fixedExtension: false,
  dts: { vue: true },
  target: "es2023",
  plugins: [Vue({ isProduction: true })],
  deps: {
    onlyBundle: [],
    neverBundle: ["next", "bun", "webpack", "mdx/types"],
  },
  exports: {
    enabled: true,
    exclude: ["./bin"],
  },
});
