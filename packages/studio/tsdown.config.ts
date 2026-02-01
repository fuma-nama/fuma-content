import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/bin.ts", "./src/bin/cli.ts"],
  format: "esm",
  dts: true,
  target: "es2023",
  unbundle: true,
});
