import { defineConfig } from "tsdown";

const external = ["next", "typescript", "bun"];

export default defineConfig({
  entry: [
    "./src/{index,dynamic,bin}.ts",
    "./src/{config,next,vite,bun}/index.ts",
    "./src/node/loader.ts",

    "./src/collections/*.ts",
    "./src/collections/{handlers,runtime,storage}/*.ts",
    "./src/collections/{mdx,meta}/{loader-webpack,runtime,runtime-browser,runtime-dynamic}.ts",

    "./src/plugins/*.ts",
    "./src/plugins/loader/{index,webpack}.ts",
  ],
  format: "esm",
  fixedExtension: false,
  external,
  dts: true,
  target: "node22",
});
