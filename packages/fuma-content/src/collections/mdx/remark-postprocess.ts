import type { Processor, Transformer } from "unified";
import type { Heading, Root, RootContent } from "mdast";
import { visit } from "unist-util-visit";
import { toMarkdown } from "mdast-util-to-markdown";
import { valueToEstree } from "estree-util-value-to-estree";
import { removePosition } from "unist-util-remove-position";
import { flattenNode } from "@/utils/mdast/flatten";
import { mdxToMarkdown } from "mdast-util-mdx";

export interface LinkReference {
  href: string;
}

export interface PostprocessOptions {
  _format: "md" | "mdx";

  /**
   * Properties to export from `vfile.data`
   */
  valueToExport?: string[];

  /**
   * stringify MDAST and export via `_markdown`.
   */
  processedMarkdown?:
    | boolean
    | {
        as?: string;
        /**
         * include heading IDs into the processed markdown.
         */
        headingIds?: boolean;
      };

  /**
   * extract link references, export via `_linkReferences`.
   */
  linkReferences?:
    | boolean
    | {
        as?: string;
      };

  /**
   * store MDAST and export via `_mdast`.
   */
  mdast?:
    | boolean
    | {
        as?: string;
        removePosition?: boolean;
      };
}

/**
 * - collect references
 * - write frontmatter (auto-title & description)
 */
export function remarkPostprocess(
  this: Processor,
  {
    _format,
    processedMarkdown = false,
    mdast = false,
    linkReferences = false,
    valueToExport = [],
  }: PostprocessOptions,
): Transformer<Root, Root> {
  return (tree, file) => {
    const frontmatter = (file.data.frontmatter ??= {});
    if (!frontmatter.title) {
      visit(tree, "heading", (node) => {
        if (node.depth === 1) {
          frontmatter.title = flattenNode(node);
          return false;
        }
      });
    }

    file.data["mdx-export"] ??= [];
    file.data["mdx-export"].push({
      name: "frontmatter",
      value: frontmatter,
    });

    if (linkReferences) {
      const { as = "_linkReferences" } = linkReferences === true ? {} : linkReferences;
      const urls: LinkReference[] = [];

      visit(tree, "link", (node) => {
        urls.push({
          href: node.url,
        });
        return "skip";
      });

      file.data["mdx-export"].push({
        name: as,
        value: urls,
      });
    }

    if (processedMarkdown) {
      const { as = "_markdown", headingIds = true } =
        processedMarkdown === true ? {} : processedMarkdown;
      const extensions = this.data("toMarkdownExtensions") ?? [];

      const markdown = toMarkdown(tree, {
        ...this.data("settings"),
        extensions: _format === "md" ? [...extensions, mdxToMarkdown()] : extensions,
        handlers: {
          heading(node: Heading) {
            const id = node.data?.hProperties?.id;
            const content = flattenNode(node);
            return headingIds && id ? `${content} [#${id}]` : content;
          },
        },
      });

      file.data["mdx-export"].push({
        name: as,
        value: markdown,
      });
    }

    if (mdast) {
      const { as = "_mdast", removePosition: shouldRemovePosition = false } =
        mdast === true ? {} : mdast;
      const stringified = JSON.stringify(
        shouldRemovePosition ? removePosition(structuredClone(tree)) : tree,
      );

      file.data["mdx-export"].push({
        name: as,
        value: stringified,
      });
    }

    for (const { name, value } of file.data["mdx-export"]) {
      tree.children.unshift(getMdastExport(name, value));
    }

    // reset the data to reduce memory usage
    file.data["mdx-export"] = [];

    for (const name of valueToExport) {
      if (!(name in file.data)) continue;

      tree.children.unshift(getMdastExport(name, file.data[name]));
    }
  };
}

/**
 * MDX.js first converts javascript (with esm support) into mdast nodes with remark-mdx, then handle the other remark plugins
 *
 * Therefore, if we want to inject an export, we must convert the object into AST, then add the mdast node
 */
function getMdastExport(name: string, value: unknown): RootContent {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            attributes: [],
            source: null,
            declaration: {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name,
                  },
                  init: valueToEstree(value),
                },
              ],
            },
          },
        ],
      },
    },
  };
}
