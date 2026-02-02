import type { EmitConfig } from "@/config";
import path from "node:path";
import { URLSearchParams } from "node:url";

export interface CodeGeneratorOptions extends EmitConfig {
  outDir: string;
}

interface ImportInfo {
  /**
   * import name -> member name
   */
  named?: Map<string, string>;
  namespaces?: Set<string>;
  /**
   * a set of import names, the import is type-only if its name is missing in this set.
   */
  isUsed?: Set<string>;
}

/**
 * Code generator (one instance per file)
 */
export class CodeGenerator {
  private readonly lines: string[] = [];
  // specifier -> imported members/info
  private readonly importInfos = new Map<string, ImportInfo>();
  private eagerImportId = 0;

  readonly options: CodeGeneratorOptions;
  constructor({
    target = "default",
    jsExtension = false,
    outDir = "",
  }: Partial<CodeGeneratorOptions>) {
    this.options = {
      target,
      jsExtension,
      outDir,
    };
  }

  addNamespaceImport(namespace: string, specifier: string, typeOnly = false) {
    const info = this.importInfos.get(specifier) ?? {};
    this.importInfos.set(specifier, info);
    if (!typeOnly) {
      info.isUsed ??= new Set();
      info.isUsed.add(namespace);
    }

    info.namespaces ??= new Set();
    info.namespaces.add(namespace);
  }

  addNamedImport(names: string[], specifier: string, typeOnly = false) {
    const info = this.importInfos.get(specifier) ?? {};
    this.importInfos.set(specifier, info);
    info.named ??= new Map();

    for (const name of names) {
      const [memberName, importName = memberName] = name.split(/\s+as\s+/, 2);
      info.named.set(importName, memberName);
      if (!typeOnly) {
        info.isUsed ??= new Set();
        info.isUsed.add(importName);
      }
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

  /** generate a random import name that is unique in file. */
  generateImportName(): string {
    return `__${this.eagerImportId++}`;
  }

  formatDynamicImport(specifier: string, mod?: string): string {
    let s = `import("${specifier}")`;
    if (mod) s += `.then(mod => mod.${mod})`;
    return s;
  }

  formatQuery(query: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    for (const k in query) {
      const value = query[k];
      if (typeof value === "string") params.set(k, value);
    }
    return params.toString();
  }

  formatImportPath(file: string) {
    const ext = path.extname(file);
    let filename: string;

    switch (ext) {
      case ".ts":
      case ".tsx":
        filename = file.substring(0, file.length - ext.length);
        if (this.options.jsExtension) filename += ".js";
        break;
      default:
        filename = file;
    }

    const importPath = slash(path.relative(this.options.outDir, filename));
    return importPath.startsWith("../") ? importPath : `./${importPath}`;
  }

  toString() {
    const final: string[] = ["// @ts-nocheck"];
    if (this.options.target === "vite") {
      final.push('/// <reference types="vite/client" />');
    }

    for (const [specifier, { namespaces, isUsed, named }] of this.importInfos) {
      if (namespaces)
        for (const namespace of namespaces) {
          final.push(
            isUsed?.has(namespace)
              ? `import * as ${namespace} from "${specifier}";`
              : `import type * as ${namespace} from "${specifier}";`,
          );
        }

      if (named && named.size > 0) {
        const namedImports: string[] = [];

        for (const [importName, memberName] of named) {
          const item = importName === memberName ? importName : `${memberName} as ${importName}`;

          namedImports.push(isUsed?.has(importName) ? item : `type ${item}`);
        }

        final.push(`import { ${namedImports.join(", ")} } from "${specifier}";`);
      }
    }

    final.push(...this.lines);
    return final.join("\n");
  }
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
