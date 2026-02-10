import picomatch from "picomatch";
import path from "node:path";
import { Collection } from ".";
import { createCache } from "@/utils/async-cache";

export class FileSystemCollection extends Collection {
  private matcher: picomatch.Matcher | undefined;
  /**
   * content directory (absolute)
   */
  dir: string;
  private readonly filesCache = createCache<string[]>();
  /** the glob patterns to match files in collection, this doesn't take `supportedFormats` into account. */
  private readonly patterns: string[];
  readonly supportedFileFormats: string[] | undefined;

  constructor(config: FileSystemCollectionConfig) {
    super();
    const { files, supportedFormats } = config;
    this.dir = config.dir;
    this.patterns = files ?? [supportedFormats ? `**/*.{${supportedFormats.join(",")}}` : `**/*`];
    this.supportedFileFormats = supportedFormats;
    this.onInit.hook(({ core }) => {
      this.dir = path.resolve(core.getOptions().cwd, this.dir);
    });
    this.onServer.hook(({ server }) => {
      if (!server.watcher) return;
      server.watcher.add(this.dir);
      server.watcher.on("all", (event, file) => {
        if (event === "change" || !this.hasFile(file)) return;
        this.filesCache.invalidate("");
      });
    });
  }

  isFileSupported(filePath: string) {
    if (!this.supportedFileFormats) return true;
    return this.supportedFileFormats.some((format) => filePath.endsWith(`.${format}`));
  }

  /**
   * get all included files, relative to `dir`.
   *
   * the result is cached.
   */
  async getFiles() {
    return this.filesCache.cached("", async () => {
      const { glob } = await import("tinyglobby");

      const out = await glob(this.patterns, { cwd: this.dir });
      return out.filter((v) => this.isFileSupported(v));
    });
  }

  hasFile(filePath: string) {
    if (!this.isFileSupported(filePath)) return false;

    const relativePath = path.relative(this.dir, filePath);
    if (relativePath.startsWith(`..${path.sep}`)) return false;

    return (this.matcher ??= picomatch(this.patterns))(relativePath);
  }

  invalidateCache() {
    this.filesCache.invalidate("");
  }
}

export interface FileSystemCollectionConfig {
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

export function fileSystemCollection(config: FileSystemCollectionConfig) {
  return new FileSystemCollection(config);
}
