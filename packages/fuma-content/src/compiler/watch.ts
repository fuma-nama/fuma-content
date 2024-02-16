import { type FSWatcher, watch as watchFn } from "chokidar";
import { getAbsolutePath } from "../utils/path";
import type { Compiler } from "./types";
import * as compile from "./compile";

export function watch(this: Compiler): FSWatcher {
  void this.emit();
  const watcher = watchFn(this.options.files, { cwd: this.options.cwd });

  watcher.on("all", (eventName, relativePath) => {
    const absolutePath = getAbsolutePath(this.options.cwd, relativePath);

    if (eventName === "add" && !this.files.includes(absolutePath)) {
      this.files.push(absolutePath);
      void this.emit();
    }

    if (eventName === "unlink") {
      this.files = this.files.filter((file) => file !== absolutePath);

      compile.removeCache(this, absolutePath);
      void this.emit();
    }

    if (eventName === "change") {
      console.log("update", relativePath);

      compile.removeCache(this, absolutePath);
      void this.compileFile(absolutePath).then(async (entry) => {
        await this.emitEntry(entry);
      });
    }
  });

  return watcher;
}
