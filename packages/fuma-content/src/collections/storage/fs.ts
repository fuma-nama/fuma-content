import picomatch from "picomatch";
import path from "node:path";
import { CollectionHandler } from "..";

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

export interface FileCollectionHandler extends CollectionHandler<"storage", {}> {
  type: "fs";
  /**
   * content directory (absolute)
   */
  dir: string;
  hasFile: (filePath: string) => boolean;
  isFileSupported: (filePath: string) => boolean;
  /**
   * get all included files, relative to `dir`
   */
  getFiles: () => Promise<string[]>;
  patterns: string[];
}

export function fileStorageHandler(config: FileHandlerConfig): FileCollectionHandler {
  const { supportedFormats } = config;
  let matcher: picomatch.Matcher;

  return {
    name: "storage",
    requirements: [],
    type: "fs",
    patterns: config.files ?? [supportedFormats ? `**/*.{${supportedFormats.join(",")}}` : `**/*`],
    get dir(): string {
      throw new Error("not initialized");
    },
    init(collection, { core }) {
      const dir = (this.dir = path.resolve(core.getOptions().cwd, config.dir));

      collection.plugins.push({
        name: `collection:${collection.name}:fs`,
        configureServer({ watcher }) {
          if (!watcher) return;
          watcher.add(dir);
        },
      });
    },
    isFileSupported(filePath) {
      if (!supportedFormats) return true;

      return supportedFormats.some((format) => filePath.endsWith(`.${format}`));
    },
    async getFiles() {
      const { glob } = await import("tinyglobby");
      return (await glob(this.patterns, { cwd: this.dir })).filter((v) => this.isFileSupported(v));
    },
    hasFile(filePath) {
      if (!this.isFileSupported(filePath)) return false;

      const relativePath = path.relative(this.dir, filePath);
      if (relativePath.startsWith(`..${path.sep}`)) return false;

      return (matcher ??= picomatch(this.patterns))(relativePath);
    },
  };
}
