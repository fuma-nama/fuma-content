import * as path from "node:path";
import FastGlob from "fast-glob";
import type { Compiler, CompilerOptions } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";

export function getAbsolutePath(cwd: string, relativePath: string): string {
  return path.join(cwd, relativePath);
}

export function getRelativePath(cwd: string, absolutePath: string): string {
  return slash(
    path.join(
      path.relative(cwd, path.dirname(absolutePath)),
      path.basename(absolutePath),
    ),
  );
}

export function getImportPath(absolutePath: string): string {
  // Normally it should be an url
  // However, importing a client component with `file:///` prefix causes the component to be missing in React Client Manifest
  // Using absolute path temporarily fixes the bug
  // (Next.js 14.0.4)
  return slash(absolutePath);
}

export function slash(anyPath: string): string {
  const isExtendedLengthPath = anyPath.startsWith("\\\\?\\");

  if (isExtendedLengthPath) {
    return anyPath;
  }

  return anyPath.replaceAll("\\", "/");
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
  entry: OutputEntry,
): string {
  return path.join(
    options.cwd,
    options.outputDir,
    path.relative(options.cwd, path.dirname(entry.file)),
    `${path.basename(entry.file, path.extname(entry.file))}${options.outputExt}`,
  );
}
