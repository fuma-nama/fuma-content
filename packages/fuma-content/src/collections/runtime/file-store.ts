import path from "node:path";
import { SimpleCollectionStore } from "@/collections/runtime/store";

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

function fileInfo(base: string, globKey: string): FileInfo {
  if (globKey.startsWith("./")) {
    globKey = globKey.slice(2);
  }

  return {
    path: globKey,
    fullPath: path.join(base, globKey),
  };
}

export class FileCollectionStore<V> extends SimpleCollectionStore<FileInfo & V> {
  constructor(base: string, glob: Record<string, V>) {
    const data = new Map<string, FileInfo & V>();
    for (const [key, value] of Object.entries(glob)) {
      data.set(key, {
        ...value,
        ...fileInfo(base, key),
      });
    }
    super(data);
  }

  transform<T>(fn: (input: FileInfo & V) => FileInfo & T): FileCollectionStore<T> {
    return super.transform(fn);
  }

  $data<T>(_cast: (input: FileInfo & V) => FileInfo & T): FileCollectionStore<T> {
    return super.$data(_cast);
  }
}
