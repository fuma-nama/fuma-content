import type { Compiler } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";
import {
  getAbsolutePath,
  getImportPath,
  getOutputPath,
  getRelativePath,
} from "../utils/path";

export interface EntryPointOptions {
  /**
   * Notice that `lazy` mode is not supported by `source` function
   *
   * @defaultValue 'import'
   */
  mode?: "lazy" | "import";

  /**
   * Use full-path for `file` property
   *
   * @defaultValue false
   */
  fullPath?: string;
}

export function loadEntryPoint(
  this: Compiler,
  entries: OutputEntry[]
): OutputEntry {
  const { mode = "import" } = this.options.entryPoint ?? {};
  let content: string;

  switch (mode) {
    case "import":
      content = generateImport(this, entries);
      break;
    default:
      content = generateLazy(this, entries);
      break;
  }

  return {
    format: "js",
    file: getAbsolutePath(this.options.cwd, "./index.js"),
    content,
    _entryPoint: {},
  };
}

function generateImport(compiler: Compiler, output: OutputEntry[]): string {
  const { fullPath = false } = compiler.options.entryPoint ?? {};
  const formats = new Map<
    string,
    {
      imports: string[];
      entries: string[];
    }
  >();

  output.forEach((entry, i) => {
    const b = formats.get(entry.format) ?? { imports: [], entries: [] };
    formats.set(entry.format, b);

    const importPath = getImportPath(getOutputPath(compiler, entry));
    const file = fullPath
      ? entry.file
      : getRelativePath(compiler.options.cwd, entry.file);
    const name = `p_${i}`;

    b.imports.push(`import * as ${name} from ${JSON.stringify(importPath)};`);

    b.entries.push(`{
...${name},
format: ${JSON.stringify(entry.format)},
file: ${JSON.stringify(file)},
}`);
  });

  const imports = Array.from(formats.values())
    .flatMap((f) => f.imports)
    .join("\n");

  const entires = Array.from(formats.entries())
    .map(([k, v]) => `${k}: [${v.entries.join(",")}]`)
    .join(",");

  return `${imports}\nexport default {${entires}};`;
}

function generateLazy(compiler: Compiler, output: OutputEntry[]): string {
  const entries: string[] = [];

  for (const entry of output) {
    const fronmatter = entry._mdx ? entry._mdx.vfile.data.frontmatter : {};
    const importPath = getImportPath(getOutputPath(compiler, entry));

    const line = `{
file: ${JSON.stringify(entry.file)},
info: ${JSON.stringify(fronmatter)},
load: () => import(${JSON.stringify(importPath)})
}`;
    entries.push(line);
  }

  return `export default [${entries.join(",\n")}]`;
}
