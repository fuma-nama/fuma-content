import picomatch from "picomatch";
import path from "node:path";
import type { InitOptions } from "@/config/collections";

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

export function buildFileHandler(
  { workspace }: InitOptions,
  config: FileHandlerConfig,
  supportedFormats: string[],
): FIleCollectionHandler {
  const patterns = config.files ?? [`**/*.{${supportedFormats.join(",")}}`];
  let matcher: picomatch.Matcher;

  return {
    patterns,
    dir: workspace ? path.resolve(workspace.dir, config.dir) : config.dir,
    isFileSupported(filePath) {
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
