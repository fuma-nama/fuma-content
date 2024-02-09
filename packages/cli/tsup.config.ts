import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/bin.ts"],
  target: "node18",
  format: "esm",
});
