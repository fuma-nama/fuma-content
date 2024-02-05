import { join } from "node:path";
import FastGlob from "fast-glob";

export function getAbsolutePath(cwd: string, path: string): string {
  return FastGlob.escapePath(join(cwd, path));
}
