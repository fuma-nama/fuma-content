import path from "node:path";
import { MapCollectionStore } from "@/collections/runtime/store";

export interface FileInfo {
  /**
   * path relative to content directory
   */
  path: string;

  /**
   * the full file path in file system
   */
  fullPath: string;
}

function formatGlobKey(globKey: string) {
  if (globKey.startsWith("./")) {
    return globKey.slice(2);
  }

  return globKey;
}

export class FileCollectionStore<V> extends MapCollectionStore<string, FileInfo & V> {
  constructor(base: string, glob: Record<string, V>) {
    const data = new Map<string, FileInfo & V>();
    for (const [key, value] of Object.entries(glob)) {
      const filePath = formatGlobKey(key);
      data.set(key, {
        ...value,
        path: filePath,
        fullPath: path.join(base, filePath),
      });
    }
    super(data);
  }

  transform<T>(fn: (input: FileInfo & V) => FileInfo & T): FileCollectionStore<T> {
    return super.transform(fn);
  }

  castData<T>(_cast: (input: FileInfo & V) => FileInfo & T): FileCollectionStore<T> {
    return super.castData(_cast);
  }
}
