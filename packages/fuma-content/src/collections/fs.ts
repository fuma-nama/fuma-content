import picomatch from "picomatch";
import path from "node:path";
import { Collection } from ".";
import { createCache } from "@/utils/async-cache";

export class FileSystemCollection extends Collection {
  private matcher: picomatch.Matcher | undefined;
  /**
   * content directory (absolute)
   */
  dir = null as unknown as string;
  private readonly config: FileSystemCollectionConfig;
  private readonly filesCache = createCache<string[]>();

  constructor(config: FileSystemCollectionConfig) {
    super();
    this.config = config;
    this.onInit.hook(({ core }) => {
      this.dir = path.resolve(core.getOptions().cwd, config.dir);
    });
    this.onServer.hook(({ server }) => {
      server.watcher?.add(this.dir);
      server.watcher?.on("all", (event, file) => {
        if (event === "change" || !this.hasFile(file)) return;
        this.filesCache.invalidate("");
      });
    });
  }

  isFileSupported(filePath: string) {
    const { supportedFormats } = this.config;
    if (!supportedFormats) return true;

    return supportedFormats.some((format) => filePath.endsWith(`.${format}`));
  }

  /**
   * get all included files, relative to `dir`
   */
  async getFiles() {
    const { glob } = await import("tinyglobby");
    return this.filesCache.cached("", async () => {
      const out = await glob(this.getPatterns(), { cwd: this.dir });
      return out.filter((v) => this.isFileSupported(v));
    });
  }

  hasFile(filePath: string) {
    if (!this.isFileSupported(filePath)) return false;

    const relativePath = path.relative(this.dir, filePath);
    if (relativePath.startsWith(`..${path.sep}`)) return false;

    return (this.matcher ??= picomatch(this.getPatterns()))(relativePath);
  }

  /** get glob patterns to match files in collection, this doesn't take `supportedFormats` into account. */
  getPatterns() {
    const { files, supportedFormats } = this.config;
    return files ?? [supportedFormats ? `**/*.{${supportedFormats.join(",")}}` : `**/*`];
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
