import { pathToFileURL } from "node:url";
import type { Compiler } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";
import { getAbsolutePath, getOutputPath } from "../utils/path";

export interface EntryPointOptions {
  /**
   * Notice that `lazy` mode is not supported by `source` function
   *
   * @defaultValue 'import'
   */
  mode?: "lazy" | "import";
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

    const importPath = pathToFileURL(getOutputPath(compiler, entry.file));
    const name = `p_${i}`;

    b.imports.push(`import * as ${name} from ${JSON.stringify(importPath)};`);

    b.entries.push(`{
...${name},
format: ${JSON.stringify(entry.format)},
file: ${JSON.stringify(entry.file)},
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
    const importPath = pathToFileURL(getOutputPath(compiler, entry.file));

    const line = `{
file: ${JSON.stringify(entry.file)},
info: ${JSON.stringify(fronmatter)},
load: () => import(${JSON.stringify(importPath)})
}`;
    entries.push(line);
  }

  return `export default [${entries.join(",\n")}]`;
}
