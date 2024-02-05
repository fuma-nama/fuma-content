import { pathToFileURL } from "node:url";
import type { Compiler } from "./types";

export interface EntryPointOptions {
  /**
   * @defaultValue 'import'
   */
  mode?: "lazy" | "import";
}

export function createEntryPoint(this: Compiler): string {
  const manifest = this.createManifest();
  const { mode = "import" } = this.options.entryPoint ?? {};

  if (mode === "lazy") {
    const entries: string[] = [];

    for (const entry of manifest.entires) {
      const fronmatter = entry.vfile.data.frontmatter;
      const importPath = pathToFileURL(entry.outputPath);

      const line = `{
file: ${JSON.stringify(entry.file)},
info: ${JSON.stringify(fronmatter)},
load: () => import(${JSON.stringify(importPath)})
}`;
      entries.push(line);
    }

    return `export default [${entries.join(",\n")}]`;
  }

  const imports: string[] = [];
  const entries: string[] = [];

  manifest.entires.forEach((entry, i) => {
    const importPath = pathToFileURL(entry.outputPath);
    const name = `p_${i}`;

    imports.push(`import ${name} from ${JSON.stringify(importPath)};`);

    const line = `{
...${name},
file: ${JSON.stringify(entry.file)},
}`;
    entries.push(line);
  });

  return `${imports.join("\n")}
export default [${entries.join(",\n")}]`;
}
