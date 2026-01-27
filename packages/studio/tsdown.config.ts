import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/lib/content/bin.ts"],
  format: "esm",
  dts: true,
  target: "es2023",
  unbundle: true,
});
