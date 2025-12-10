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

interface ImportInfo {
  // import name -> member name
  named: Map<string, string>;
  namespaces: Set<string>;
  /**
   * a set of import names, the import is type-only if its name is missing in this set.
   */
  isUsed: Set<string>;
}

function importInfo(): ImportInfo {
  return {
    named: new Map(),
    namespaces: new Set(),
    isUsed: new Set(),
  };
}

/**
 * Code generator (one instance per file)
 */
export class CodeGenerator {
  private readonly lines: string[] = [];
  private readonly globCache: Map<string, Promise<string[]>>;
  // specifier -> imported members/info
  private readonly importInfos = new Map<string, ImportInfo>();
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
    const info = this.importInfos.get(specifier) ?? importInfo();
    this.importInfos.set(specifier, info);
    if (!types) info.isUsed.add(namespace);
    info.namespaces.add(namespace);
  }

  addNamedImport(names: string[], specifier: string, types = false) {
    const info = this.importInfos.get(specifier) ?? importInfo();
    this.importInfos.set(specifier, info);
    for (const name of names) {
      const [memberName, importName = memberName] = name.split(/\s+as\s+/, 2);
      info.named.set(importName, memberName);
      if (!types) info.isUsed.add(importName);
    }
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
    const final: string[] = ["// @ts-nocheck"];
    if (this.options.target === "vite") {
      final.push('/// <reference types="vite/client" />');
    }

    for (const [specifier, info] of this.importInfos) {
      const { namespaces, named, isUsed } = info;
      for (const namespace of namespaces) {
        final.push(
          isUsed.has(namespace)
            ? `import * as ${namespace} from "${specifier}";`
            : `import type * as ${namespace} from "${specifier}";`,
        );
      }

      const namedImports: string[] = [];
      for (const [importName, memberName] of named) {
        const item =
          importName === memberName
            ? importName
            : `${memberName} as ${importName}`;

        namedImports.push(isUsed.has(importName) ? item : `type ${item}`);
      }

      if (namedImports.length > 0) {
        final.push(
          `import { ${namedImports.join(", ")} } from "${specifier}";`,
        );
      }
    }

    final.push(...this.lines);
    return final.join("\n");
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
