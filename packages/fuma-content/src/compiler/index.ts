import fs from "node:fs/promises";
import path from "node:path";
import loadMDX, { type Options as MDXOptions } from "../loader/mdx";
import { glob, type Options as GlobOptions } from "fast-glob";
import type { VFile } from "@mdx-js/mdx/lib/compile";

export interface CompilerOptions {
  files: string | string[];

  cwd?: string;
  outputDir?: string;
  outputExt?: string;

  mdxOptions?: MDXOptions;
  globOptions?: GlobOptions;
}

interface OutputEntry {
  file: string;
  content: string;
  vfile: VFile;
}

export interface Compiler {
  options: CompilerOptions;

  /**
   * Files to compile
   */
  files: string[];
  compile: () => Promise<OutputEntry[]>;
  createManifest: () => Promise<void>;
  emit: () => Promise<void>;

  _output?: OutputEntry[];
}

async function compile(this: Compiler): Promise<OutputEntry[]> {
  const { mdxOptions = {} } = this.options;

  const loads = this.files.map(async (file) => {
    const content = (await fs.readFile(file)).toString();
    const output = await loadMDX(file, content, mdxOptions);

    return {
      file,
      vfile: output.file,
      content: output.content,
    } satisfies OutputEntry;
  });

  this._output = await Promise.all(loads);

  return this._output;
}

async function emit(this: Compiler): Promise<void> {
  const entires = this._output ?? (await this.compile());
  const {
    cwd = process.cwd(),
    outputExt = ".js",
    outputDir = "./dist",
  } = this.options;

  const emits = entires.map(async ({ file, content }) => {
    const outputPath = path.join(
      cwd,
      outputDir,
      path.relative(cwd, path.dirname(file)),
      `${path.basename(file, path.extname(file))}${outputExt}`
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
  });

  await Promise.all(emits);
}

async function createManifest(this: Compiler) {}

export async function createCompiler(
  options: CompilerOptions
): Promise<Compiler> {
  const { cwd = process.cwd(), globOptions } = options;
  const files = await glob(options.files, {
    cwd,
    absolute: true,
    ...globOptions,
  });

  return {
    files,
    options,
    compile,
    createManifest,
    emit,
  };
}
