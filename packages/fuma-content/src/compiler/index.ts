import { globFiles } from "../utils/path";
import { loadMDX } from "../loader/mdx";
import { loadJson } from "../loader/json";
import type { Transformer } from "../loader/types";
import { emit, emitEntry } from "./emit";
import type { CompilerOptions, Compiler } from "./types";
import { compile, compileFile } from "./compile";
import { watch } from "./watch";

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
  options: CreateCompilerOptions,
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
    watch,
    emit,
    compileFile,
    loaders: createLoaders(compilerOptions),
  };
}

function createLoaders(options: CompilerOptions): Record<string, Transformer> {
  const mdx = loadMDX(options.mdxOptions);

  return {
    mdx,
    md: mdx,
    json: loadJson(),
    ...options.loaders,
  };
}
