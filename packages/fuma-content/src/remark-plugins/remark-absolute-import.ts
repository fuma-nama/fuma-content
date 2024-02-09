import * as path from "node:path";
import type { Root } from "mdast";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";
import { getImportPath } from "../utils/path";

interface Options {
  enabled: boolean;
}

/**
 * Export properties from `vfile.data`
 */
function remarkAbsoluteImport({ enabled }: Options): Transformer<Root, Root> {
  return (tree, vfile) => {
    if (!enabled) return;

    visit(tree, ["mdxjsEsm"], (node) => {
      if (node.type !== "mdxjsEsm") return;
      const body = node.data?.estree?.body ?? [];

      body.forEach((statement) => {
        if (
          statement.type === "ImportDeclaration" &&
          typeof statement.source.value === "string"
        ) {
          const value = statement.source.value;

          // handles relative nodes
          if (value.startsWith("./") || value.startsWith("../")) {
            const replace = getImportPath(
              path.join(path.dirname(vfile.path), value)
            );

            statement.source.value = replace;
            statement.source.raw = JSON.stringify(replace);
          }
        }
      });
    });
  };
}

export { remarkAbsoluteImport, type Options };
