import * as path from "node:path";
import FastGlob from "fast-glob";
import type { Compiler, CompilerOptions } from "../compiler/types";

export function getAbsolutePath(cwd: string, file: string): string {
  return FastGlob.escapePath(path.join(cwd, file));
}

export async function globFiles({
  cwd,
  globOptions,
  files,
}: CompilerOptions): Promise<string[]> {
  return FastGlob.glob(files, {
    cwd,
    ...globOptions,
  }).then((result) => result.map((file) => getAbsolutePath(cwd, file)));
}

export function getOutputPath(
  { options }: Compiler,
  sourceFile: string
): string {
  return path.join(
    options.cwd,
    options.outputDir,
    path.relative(options.cwd, path.dirname(sourceFile)),
    `${path.basename(sourceFile, path.extname(sourceFile))}${options.outputExt}`
  );
}
