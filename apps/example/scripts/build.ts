import { createCompiler } from "fuma-content/internal";

createCompiler({ files: ["./content/**/*.md"] }).then((compiler) => {
  compiler.emit();
});
