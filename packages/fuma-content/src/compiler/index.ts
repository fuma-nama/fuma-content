import { emit, emitEntry } from "./emit";
import { createManifest } from "./manifest";
import type { CompilerOptions, Compiler } from "./types";
import { compile, compileFile } from "./compile";
import { globFiles, watch } from "./watch";

const defaultOptions = {
  cwd: process.cwd(),
  outputDir: "./dist",
  outputExt: ".js",
};

export type CreateCompilerOptions = Pick<
  Partial<CompilerOptions>,
  keyof typeof defaultOptions
> &
  Omit<CompilerOptions, keyof typeof defaultOptions>;

export async function createCompiler(
  options: CreateCompilerOptions
): Promise<Compiler> {
  const compilerOptions: CompilerOptions = {
    ...defaultOptions,
    ...options,
  };
  const files = await globFiles(compilerOptions);

  return {
    files,
    options: compilerOptions,
    compile,
    emitEntry,
    createManifest,
    watch,
    emit,
    compileFile,
    _cache: new Map(),
  };
}
