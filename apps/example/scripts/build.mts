import { createCompiler } from "fuma-content";

createCompiler({ files: ["./content/**/*.md"] }).then((compiler) => {
  compiler.emit();
});
