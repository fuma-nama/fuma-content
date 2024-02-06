import { pathToFileURL } from "node:url";
import type { Compiler } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";
import { getAbsolutePath, getOutputPath } from "../utils/path";

export interface EntryPointOptions {
  /**
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
    file: getAbsolutePath(this.options.cwd, "./index.js"),
    content,
    _entryPoint: {},
  };
}

function generateImport(compiler: Compiler, output: OutputEntry[]): string {
  const imports: string[] = [];
  const entries: string[] = [];

  output.forEach((entry, i) => {
    const importPath = pathToFileURL(getOutputPath(compiler, entry.file));
    const name = `p_${i}`;

    imports.push(`import * as ${name} from ${JSON.stringify(importPath)};`);

    const line = `{
...${name},
file: ${JSON.stringify(entry.file)},
}`;
    entries.push(line);
  });

  return `${imports.join("\n")}
export default [${entries.join(",\n")}]`;
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
