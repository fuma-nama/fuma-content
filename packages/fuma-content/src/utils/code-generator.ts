import path from "node:path";
import { glob } from "tinyglobby";

export interface GlobImportOptions {
  base: string;
  query?: Record<string, string | undefined>;
  import?: string;
  eager?: boolean;
}

export interface CodeGeneratorOptions {
  target: "default" | "vite";
  outDir: string;
  /**
   * add .js extenstion to imports
   */
  jsExtension: boolean;
  globCache: Map<string, Promise<string[]>>;
}

/**
 * Code generator (one instance per file)
 */
export class CodeGenerator {
  private readonly lines: string[] = [];
  private readonly globCache: Map<string, Promise<string[]>>;
  private eagerImportId = 0;

  readonly options: CodeGeneratorOptions;
  constructor({
    target = "default",
    jsExtension = false,
    globCache = new Map(),
    outDir = "",
  }: Partial<CodeGeneratorOptions>) {
    this.options = {
      target,
      jsExtension,
      globCache,
      outDir,
    };
    this.globCache = globCache;
  }

  addNamespaceImport(namespace: string, specifier: string, types = false) {
    this.lines.unshift(
      types
        ? `import type * as ${namespace} from "./${specifier}";`
        : `import * as ${namespace} from "./${specifier}";`,
    );
  }

  addNamedImport(names: string[], specifier: string, types = false) {
    this.lines.unshift(
      types
        ? `import type { ${names.join(", ")} } from "${specifier}";`
        : `import { ${names.join(", ")} } from "${specifier}";`,
    );
  }

  push(...insert: string[]) {
    this.lines.push(...insert);
  }

  async pushAsync(insert: Promise<string | undefined>[]) {
    for (const line of await Promise.all(insert)) {
      if (line === undefined) continue;

      this.lines.push(line);
    }
  }

  async generateGlobImport(
    patterns: string | string[],
    options: GlobImportOptions,
  ): Promise<string> {
    if (this.options.target === "vite") {
      return this.generateViteGlobImport(patterns, options);
    }

    return this.generateNodeGlobImport(patterns, options);
  }

  private generateViteGlobImport(
    patterns: string | string[],
    { base, ...rest }: GlobImportOptions,
  ): string {
    patterns = (typeof patterns === "string" ? [patterns] : patterns).map(
      normalizeViteGlobPath,
    );

    return `import.meta.glob(${JSON.stringify(patterns)}, ${JSON.stringify(
      {
        base: normalizeViteGlobPath(path.relative(this.options.outDir, base)),
        ...rest,
      },
      null,
      2,
    )})`;
  }

  private async generateNodeGlobImport(
    patterns: string | string[],
    { base, eager = false, query = {}, import: importName }: GlobImportOptions,
  ): Promise<string> {
    const cacheKey = JSON.stringify({ patterns, base });
    let files = this.globCache.get(cacheKey);
    if (!files) {
      files = glob(patterns, {
        cwd: base,
      });
      this.globCache.set(cacheKey, files);
    }

    let code: string = "{";
    for (const item of await files) {
      const fullPath = path.join(base, item);
      const searchParams = new URLSearchParams();

      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) searchParams.set(k, v);
      }

      const importPath = `${this.formatImportPath(fullPath)}?${searchParams.toString()}`;
      if (eager) {
        const name = `__fd_glob_${this.eagerImportId++}`;
        this.lines.unshift(
          importName
            ? `import { ${importName} as ${name} } from ${JSON.stringify(importPath)}`
            : `import * as ${name} from ${JSON.stringify(importPath)}`,
        );

        code += `${JSON.stringify(item)}: ${name}, `;
      } else {
        let line = `${JSON.stringify(item)}: () => import(${JSON.stringify(importPath)})`;
        if (importName) {
          line += `.then(mod => mod.${importName})`;
        }

        code += `${line}, `;
      }
    }

    code += "}";
    return code;
  }

  formatImportPath(file: string) {
    const ext = path.extname(file);
    let filename: string;

    if (ext === ".ts") {
      filename = file.substring(0, file.length - ext.length);
      if (this.options.jsExtension) filename += ".js";
    } else {
      filename = file;
    }

    const importPath = slash(path.relative(this.options.outDir, filename));
    return importPath.startsWith(".") ? importPath : `./${importPath}`;
  }

  toString() {
    const banner: string[] = ["// @ts-nocheck"];
    if (this.options.target === "vite") {
      banner.push('/// <reference types="vite/client" />');
    }

    return [...banner, ...this.lines].join("\n");
  }
}

/**
 * convert into POSIX & relative file paths, such that Vite can accept it.
 */
function normalizeViteGlobPath(file: string) {
  file = slash(file);
  if (file.startsWith("./")) return file;
  if (file.startsWith("/")) return `.${file}`;

  return `./${file}`;
}

export function slash(path: string): string {
  const isExtendedLengthPath = path.startsWith("\\\\?\\");

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replaceAll("\\", "/");
}

export function ident(code: string, tab: number = 1) {
  return code
    .split("\n")
    .map((v) => "  ".repeat(tab) + v)
    .join("\n");
}
