import { watch as watchFn } from "chokidar";
import fg from "fast-glob";
import { getAbsolutePath } from "../utils/path";
import type { Compiler, CompilerOptions } from "./types";

export function watch(this: Compiler): void {
  const watcher = watchFn(this.options.files, { cwd: this.options.cwd });

  watcher.on("all", (eventName, path) => {
    const absolutePath = getAbsolutePath(this.options.cwd, path);

    if (["add", "unlink"].includes(eventName)) {
      void globFiles(this.options).then((files) => {
        this.files = files;
      });
    }

    if (["add", "change"].includes(eventName)) {
      console.log("update", path);

      this._cache.delete(absolutePath);
      void this.compileFile(absolutePath).then(async (entry) => {
        await this.emitEntry(entry);
      });
    }
  });
}

export async function globFiles(options: CompilerOptions): Promise<string[]> {
  const { cwd, globOptions, files } = options;

  return fg.glob(files, {
    absolute: true,
    cwd,
    ...globOptions,
  });
}
