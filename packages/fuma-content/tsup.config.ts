import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/internal.ts", "./src/cli/index.ts"],
  target: "node18",
  format: "esm",
  dts: true,
});
