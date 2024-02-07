/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve("eslint-config/library.js")],
  ignorePatterns: ["**/test/**/*", "tsup.config.ts"],
  rules: {
    // for commonjs compatibility
    "import/no-named-as-default-member": "off",
    "no-console": "off",
  },
};
