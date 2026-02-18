import path from "node:path";
import { type Frontmatter, frontmatterSchema } from "./schema";
import { slug } from "github-slugger";
import { slash } from "@/utils/code-generator";
import { Awaitable } from "@/types";
import { readFile } from "node:fs/promises";
import { fumaMatter } from "../mdx/fuma-matter";

type RenameOutputFn = (originalOutputPath: string, file: VaultFile) => string;
type RenameOutputPreset = "ignore" | "simple";

export interface VaultStorageOptions {
  files: string[];
  /** vault directory */
  dir: string;
  /**
   * rename output path
   *
   * @defaultValue 'simple'
   */
  outputPath?: RenameOutputFn | RenameOutputPreset;

  /**
   * generate URL from media file, default to original file path (normalized)
   */
  url?: (outputPath: string, mediaFile: VaultFile) => string | undefined;

  /**
   * enforce all Markdown documents to be MDX
   *
   * @defaultValue true
   */
  enforceMdx?: boolean;
}

/**
 * a virtual storage containing all files in the vault
 */
export interface VaultStorage {
  files: Map<string, ParsedFile>;
}

export interface VaultFile {
  /**
   * paths relative to vault folder
   */
  path: string;

  _raw: {
    /**
     * original path, either:
     * - relative to cwd
     * - absolute
     */
    path: string;
  };

  read: () => Awaitable<string>;
}

export type ParsedFile = ParsedContentFile | ParsedMediaFile | ParsedDataFile;

export interface ParsedContentFile extends VaultFile {
  format: "content";
  frontmatter: Frontmatter;

  /**
   * output path (relative to content directory)
   */
  outPath: string;
  content: string;
}

export interface ParsedMediaFile extends VaultFile {
  format: "media";

  /**
   * output path (relative to asset directory)
   */
  outPath: string;
  /**
   * The output URL. When undefined, it means the file is only accessible via paths.
   */
  url?: string;
}

export interface ParsedDataFile extends VaultFile {
  format: "data";
  outPath: string;
}

/**
 * Build virtual storage containing all files in the vault
 */
export async function buildStorage(options: VaultStorageOptions): Promise<VaultStorage> {
  const {
    files,
    dir,
    url = (file) => {
      const segs = normalize(file)
        .split("/")
        .filter((v) => v.length > 0);
      return `/${segs.join("/")}`;
    },
    outputPath: outputPathOption = "simple",
    enforceMdx = true,
  } = options;
  const getOutputPath =
    typeof outputPathOption === "function"
      ? outputPathOption
      : createRenameOutput(outputPathOption);

  const storage = new Map<string, ParsedFile>();

  for (const file of files) {
    const normalizedPath = normalize(path.relative(dir, file));
    const raw: VaultFile = {
      _raw: { path: file },
      path: normalizedPath,
      async read() {
        const res = await readFile(file);
        return res.toString();
      },
    };
    let outPath = getOutputPath(normalizedPath, raw);
    let parsed: ParsedFile;

    switch (path.extname(normalizedPath)) {
      case ".json":
      case ".yaml":
      case ".yml":
      case ".toml":
        parsed = {
          format: "data",
          outPath,
          ...raw,
        };
        break;
      case ".md":
      case ".mdx": {
        const rawContent = await raw.read();
        const { data, content } = fumaMatter(rawContent);
        if (enforceMdx) {
          outPath = outPath.slice(0, -path.extname(outPath).length) + ".mdx";
        }

        parsed = {
          format: "content",
          outPath,
          frontmatter: frontmatterSchema.parse(data),
          content,
          ...raw,
          read() {
            return rawContent;
          },
        };
        break;
      }
      default:
        parsed = {
          format: "media",
          url: url(outPath, raw),
          outPath,
          ...raw,
        };
    }

    storage.set(normalizedPath, parsed);
  }

  return { files: storage };
}

function createRenameOutput(preset: RenameOutputPreset): RenameOutputFn {
  if (preset === "ignore") return (file) => file;

  const occurrences = new Map<string, number>();
  return (file) => {
    const ext = path.extname(file);
    const segs = file.slice(0, -ext.length).split("/");
    for (let i = 0; i < segs.length; i++) {
      // preserve separators
      segs[i] = slug(segs[i]);
    }
    // we only count occurrences by the full path
    let out = segs.join("/");
    const o = occurrences.get(out) ?? 0;
    occurrences.set(out, o + 1);
    if (o > 0) out += `-${o}`;
    return out + ext;
  };
}

export function normalize(filePath: string): string {
  filePath = slash(filePath);
  if (filePath.startsWith("../")) throw new Error(`${filePath} points outside of vault folder`);

  return filePath.startsWith("./") ? filePath.slice(2) : filePath;
}
