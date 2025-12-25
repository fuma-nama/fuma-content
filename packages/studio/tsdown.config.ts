import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./plugin/index.tsx"],
  format: "esm",
  dts: true,
  target: "node22",
  unbundle: true,
});
