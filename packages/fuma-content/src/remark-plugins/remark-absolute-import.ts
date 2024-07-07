import * as path from "node:path";
import type { Root } from "mdast";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";
import { getImportPath, getOutputPath } from "../utils/path";
import type { Compiler } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";

export interface Options {
  compiler: Compiler;

  /**
   * Transform imports with specific extension to its output paths
   */
  transformFormats: string[];
}

export interface Context {
  dependencies: OutputEntry[];
}

export function remarkAbsoluteImport({
  compiler,
  transformFormats,
}: Options): Transformer<Root, Root> {
  return async (tree, vfile) => {
    const transforms: Promise<OutputEntry>[] = [];

    visit(tree, "mdxjsEsm", (node) => {
      const body = node.data?.estree?.body ?? [];

      for (const statement of body) {
        if (
          statement.type !== "ImportDeclaration" ||
          typeof statement.source.value !== "string"
        )
          continue;
        const value = statement.source.value;

        if (!value.startsWith("./") && !value.startsWith("../")) continue;
        const file = path.join(path.dirname(vfile.path), value);

        // transform to output path
        if (transformFormats.includes(path.extname(file).slice(1))) {
          const transform = compiler.compileFile(file).then((entry) => {
            statement.source.value = getImportPath(
              getOutputPath(compiler, entry),
            );
            delete statement.source.raw;

            return entry;
          });

          transforms.push(transform);
          continue;
        }

        // transform to absolute path
        const replace = getImportPath(file);

        statement.source.value = replace;
        delete statement.source.raw;
      }
    });

    vfile.data.ctx = { dependencies: await Promise.all(transforms) } as Context;
  };
}
