import fs from "node:fs/promises";
import path from "node:path";
import { createCache } from "@/utils/async-cache";

const cache = createCache<string>();

export function createFSCache() {
  return {
    read(file: string) {
      const fullPath = toFullPath(file);

      return cache.cached(fullPath, async () => {
        return (await fs.readFile(fullPath)).toString();
      });
    },

    delete(file: string) {
      cache.store.delete(toFullPath(file));
    },
  };
}

/**
 * make file paths relative to cwd
 */
function toFullPath(file: string) {
  if (path.isAbsolute(file)) {
    return path.relative(process.cwd(), file);
  }

  return file;
}
