import picomatch from "picomatch";
import path from "node:path";
import type { Collection, InitOptions } from "@/collections";

export interface FileHandlerConfig {
  /**
   * Directory to scan
   */
  dir: string;

  /**
   * what files to include/exclude (glob patterns)
   *
   * Include all files if not specified
   */
  files?: string[];

  /**
   * Restrict to a list of file extensions to include, e.g. `['js', 'ts']`.
   */
  supportedFormats?: string[];
}

export interface FIleCollectionHandler {
  /**
   * content directory (absolute)
   */
  dir: string;
  hasFile: (filePath: string) => boolean;
  isFileSupported: (filePath: string) => boolean;
  patterns: string[];
}

export function initFileCollection(
  collection: Collection,
  init: InitOptions,
  config: FileHandlerConfig,
) {
  const { workspace } = init;
  const { supportedFormats, dir, files } = config;
  const patterns =
    files ?? (supportedFormats ? [`**/*.{${supportedFormats.join(",")}}`] : [`**/*`]);
  let matcher: picomatch.Matcher;

  collection.handlers.fs = {
    patterns,
    dir: workspace ? path.resolve(workspace.dir, dir) : dir,
    isFileSupported(filePath) {
      if (!supportedFormats) return true;

      return supportedFormats.some((format) => filePath.endsWith(`.${format}`));
    },
    hasFile(filePath) {
      if (!this.isFileSupported(filePath)) return false;

      const relativePath = path.relative(this.dir, filePath);
      if (relativePath.startsWith(`..${path.sep}`)) return false;

      return (matcher ??= picomatch(patterns))(relativePath);
    },
  };
}
