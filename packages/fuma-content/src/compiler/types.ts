import { type Options as GlobOptions } from "fast-glob";
import { type Options as MDXOptions } from "../loader/mdx";
import type { EntryPointOptions } from "../loader/entry-point";
import type { OutputEntry, compile, compileFile } from "./compile";
import type { EmitEntry, emit, emitEntry } from "./emit";
import type { createManifest } from "./manifest";
import type { watch } from "./watch";

export interface CompilerOptions {
  files: string[];

  cwd: string;
  outputDir: string;
  outputExt: string;

  entryPoint?: EntryPointOptions;
  mdxOptions?: MDXOptions;
  globOptions?: GlobOptions;
}

export interface Compiler {
  options: CompilerOptions;

  /**
   * Files to compile
   */
  files: string[];
  compile: typeof compile;
  compileFile: typeof compileFile;
  createManifest: typeof createManifest;
  emit: typeof emit;
  emitEntry: typeof emitEntry;
  watch: typeof watch;

  _output?: OutputEntry[];
  _emit?: EmitEntry[];
  _cache: Map<string, OutputEntry>;
}
