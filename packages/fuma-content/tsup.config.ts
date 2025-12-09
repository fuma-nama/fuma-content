import { defineConfig } from "tsup";

const external = ["next", "typescript", "bun"];

export default defineConfig([
  {
    entry: [
      "./src/{index,bin}.ts",
      "./src/{config,next,vite,bun}/index.ts",
      "./src/node/loader.ts",

      "./src/collections/*.ts",
      "./src/collections/{handlers,runtime}/*.ts",
      "./src/collections/*/{loader-webpack,runtime}.ts",

      "./src/plugins/*.ts",
      "./src/plugins/with-loader/{index,webpack}.ts",
    ],
    format: "esm",
    external,
    dts: true,
    target: "node22",
  },
  {
    entry: {
      // ensure Next.js CJS config compatibility
      // because next.config.ts by default uses CJS
      "./next/index": "./src/next/index.ts",
    },
    format: "cjs",
    external,
    dts: false,
    target: "node22",
  },
]);
