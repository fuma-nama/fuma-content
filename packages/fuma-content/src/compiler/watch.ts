import { resolve } from "node:path";
import type { Compiler, CompilerOptions } from "./types";
import { watch as watchFn } from "chokidar";
import fg from "fast-glob";

export function watch(this: Compiler): void {
  const watcher = watchFn(this.options.files, { cwd: this.options.cwd });

  watcher.on("all", async (eventName, path) => {
    const absolutePath = getAbsolutePath(this, path);

    if (["add", "unlink"].includes(eventName)) {
      this.files = await globFiles(this.options);
    }

    if (["add", "change"].includes(eventName)) {
      console.log("update", path);

      this._cache.delete(absolutePath);
      void this.emitEntry(await this.compileFile(absolutePath));
    }
  });
}

function getAbsolutePath(compiler: Compiler, path: string) {
  return fg.escapePath(resolve(compiler.options.cwd, path));
}

export async function globFiles(options: CompilerOptions): Promise<string[]> {
  const { cwd, globOptions, files } = options;

  return await fg.glob(files, {
    absolute: true,
    cwd,
    ...globOptions,
  });
}
