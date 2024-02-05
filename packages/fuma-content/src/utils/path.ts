import { join } from "node:path";
import FastGlob from "fast-glob";
import type { CompilerOptions } from "../compiler/types";

export function getAbsolutePath(cwd: string, path: string): string {
  return FastGlob.escapePath(join(cwd, path));
}

export async function globFiles({
  cwd,
  globOptions,
  files,
}: CompilerOptions): Promise<string[]> {
  return FastGlob.glob(files, {
    absolute: true,
    cwd,
    ...globOptions,
  });
}
