import { createCompiler } from "../dist/index.js";

createCompiler({ files: ["./content/**/*.md"] }).then((compiler) => {
  compiler.watch();
});
