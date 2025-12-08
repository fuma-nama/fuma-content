import path from "node:path";
import { type CollectionList, list } from "@/collections/list/runtime";

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

export function globToFileList<V extends object>(
  base: string,
  glob: Record<string, V>,
): CollectionList<FileInfo & V> {
  function fileInfo(globKey: string): FileInfo {
    if (globKey.startsWith("./")) {
      globKey = globKey.slice(2);
    }

    return {
      path: globKey,
      fullPath: path.join(base, globKey),
    };
  }

  return list(
    Object.entries(glob).map(([key, value]) => {
      return {
        ...value,
        ...fileInfo(key),
      } satisfies FileInfo & V;
    }),
  );
}
