import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

const external = ["next", "bun", "webpack", "mdx/types"];

export default defineConfig({
  entry: [
    "./src/{index,dynamic,bin}.ts",
    "./src/{config,node,next,vite,bun}/index.ts",
    "./src/node/loader.ts",

    "./src/collections/*.ts",
    "./src/collections/**/{loader-webpack,runtime,runtime-*}.ts",

    "./src/collections/runtime/*.ts",
    "./src/collections/mdx/react.ts",
    // still doesn't work, may need upstream fix from tsdown
    // "./src/collections/mdx/vue.vue",

    "./src/plugins/*.ts",
    "./src/plugins/loader/{index,webpack}.ts",
  ],
  format: "esm",
  fixedExtension: false,
  external,
  dts: { vue: true },
  target: "es2023",
  plugins: [Vue({ isProduction: true })],
  inlineOnly: [],
});
