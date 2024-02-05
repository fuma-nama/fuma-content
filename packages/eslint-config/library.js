const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve("@vercel/style-guide/eslint/node"),
    "eslint:recommended",
    "prettier",
    require.resolve("@vercel/style-guide/eslint/typescript"),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  parserOptions: {
    project,
  },
  env: {
    node: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
  ],
};
