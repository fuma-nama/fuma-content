import { defineConfig } from "tsdown";

const external = ["next", "typescript", "bun"];

export default defineConfig([
  {
    entry: [
      "./src/{index,bin}.ts",
      "./src/{config,next,vite,bun}/index.ts",
      "./src/node/loader.ts",

      "./src/collections/*.ts",
      "./src/collections/{handlers,runtime}/*.ts",
      "./src/collections/{mdx,meta}/{loader-webpack,runtime,runtime-browser,runtime-dynamic}.ts",

      "./src/plugins/*.ts",
      "./src/plugins/with-loader/{index,webpack}.ts",
    ],
    format: "esm",

    outExtensions: () => ({
      dts: ".d.ts",
      js: ".js",
    }),
    external,
    dts: true,
    target: "node22",
  },
  {
    // ensure Next.js CJS config compatibility
    // because next.config.ts by default uses CJS
    entry: {
      "next/*": "./src/next/*.ts",
    },
    format: "cjs",
    external,
    dts: false,
    target: "node22",
  },
]);
