import picomatch from "picomatch";
import path from "node:path";
import { Collection } from ".";

export class FileSystemCollection extends Collection {
  private matcher: picomatch.Matcher | undefined;
  /**
   * content directory (absolute)
   */
  dir = null as unknown as string;
  readonly patterns: string[];
  private readonly supportedFormats: string[] | undefined;

  constructor(config: FileSystemCollectionConfig) {
    super();
    const { supportedFormats } = config;
    this.supportedFormats = supportedFormats;
    this.patterns = config.files ?? [
      supportedFormats ? `**/*.{${supportedFormats.join(",")}}` : `**/*`,
    ];

    this.onInit.pipe(({ core }) => {
      this.dir = path.resolve(core.getOptions().cwd, config.dir);
    });
    this.onServer.pipe(({ server: { watcher } }) => {
      if (!watcher) return;
      watcher.add(this.dir);
    });
  }

  isFileSupported(filePath: string) {
    if (!this.supportedFormats) return true;

    return this.supportedFormats.some((format) => filePath.endsWith(`.${format}`));
  }

  /**
   * get all included files, relative to `dir`
   */
  async getFiles() {
    const { glob } = await import("tinyglobby");
    return (await glob(this.patterns, { cwd: this.dir })).filter((v) => this.isFileSupported(v));
  }

  hasFile(filePath: string) {
    if (!this.isFileSupported(filePath)) return false;

    const relativePath = path.relative(this.dir, filePath);
    if (relativePath.startsWith(`..${path.sep}`)) return false;

    return (this.matcher ??= picomatch(this.patterns))(relativePath);
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
