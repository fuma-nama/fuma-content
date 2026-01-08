import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./lib/index.tsx", "./lib/bin.ts"],
  format: "esm",
  dts: true,
  target: "node22",
  unbundle: true,
});
