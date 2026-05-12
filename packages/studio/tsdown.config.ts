import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/bin.ts"],
  format: "esm",
  outDir: "dist/cli",
  dts: { sourcemap: false },
  target: "es2023",
  exports: {
    bin: {
      "content-studio": "./src/bin.ts",
    },
  },
  deps: {
    onlyBundle: [
      "open",
      "default-browser-id",
      "default-browser",
      "define-lazy-prop",
      "is-docker",
      "is-in-ssh",
      "is-inside-container",
      "is-wsl",
      "powershell-utils",
      "run-applescript",
      "wsl-utils",
      "bundle-name",
    ],
  },
});
