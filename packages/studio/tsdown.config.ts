import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./plugin/index.ts"],
  format: "esm",
  dts: true,
  target: "node22",
});
