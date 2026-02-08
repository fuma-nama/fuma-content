import {
  convertChildrenDeserialize,
  convertNodesSerialize,
  MarkdownPlugin,
  MdMdxJsxFlowElement,
  MdMdxJsxTextElement,
  remarkMdx,
} from "@platejs/markdown";
import { getPluginType, KEYS, TText } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { ELEMENT_MDX_COMPONENT } from "./mdx-component-kit";
import { visit } from "unist-util-visit";
import type { MdxComponentElement } from "../types";
import type { Transformer } from "unified";
import type { Root } from "mdast";

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkRefactorCustomElements as never],
      rules: {
        code_block: {
          deserialize: (mdastNode, _deco, options) => ({
            children: (mdastNode.value || "").split("\n").map((line) => ({
              children: [{ text: line } as TText],
              type: getPluginType(options.editor!, KEYS.codeLine),
            })),
            lang: mdastNode.lang ?? undefined,
            meta: mdastNode.meta,
            type: getPluginType(options.editor!, KEYS.codeBlock),
          }),
          serialize: (node) => ({
            lang: node.lang,
            type: "code",
            meta: node.meta as string,
            value: node.children
              .map((child: any) =>
                child?.children === undefined
                  ? child.text
                  : child.children.map((c: any) => c.text).join(""),
              )
              .join("\n"),
          }),
        },

        // TODO: support non-primitive attributes
        [ELEMENT_MDX_COMPONENT]: {
          deserialize: (mdastNode: MdMdxJsxTextElement, deco, options): MdxComponentElement => ({
            children: convertChildrenDeserialize(mdastNode.children, deco, options),
            element: mdastNode.name,
            customProps: Object.fromEntries(
              mdastNode.attributes.map((attr) => {
                if (attr.type === "mdxJsxAttribute") return [attr.name, attr.value];
                return ["_", attr.value];
              }),
            ),
            type: ELEMENT_MDX_COMPONENT,
          }),
          serialize: (node: MdxComponentElement, options): MdMdxJsxFlowElement => ({
            type: "mdxJsxFlowElement",
            attributes: Object.entries(node.customProps).map(([k, v]) => ({
              type: "mdxJsxAttribute",
              name: k,
              value: v as string,
            })),
            name: node.element,
            children: convertNodesSerialize(node.children, options) as never[],
          }),
        },
      },
    },
  }),
];

function remarkRefactorCustomElements(): Transformer<Root, Root> {
  const supportedNodeTypes = new Set([
    "a",
    "audio",
    "blockquote",
    "bold",
    "callout",
    "code",
    "code_block",
    "column",
    "column_group",
    "comment",
    "date",
    "equation",
    "file",
    "hr",
    "img",
    "inline_equation",
    "italic",
    "mention",
    "p",
    "strikethrough",
    "subscript",
    "suggestion",
    "superscript",
    "table",
    "td",
    "th",
    "toc",
    "toggle",
    "tr",
    "underline",
    "video",
  ]);
  return (tree) => {
    visit(tree, ["mdxJsxFlowElement", "mdxJsxTextElement"], (_node) => {
      const node = _node as MdMdxJsxFlowElement | MdMdxJsxFlowElement;
      if (node.name && supportedNodeTypes.has(node.name)) return;
      node.type = ELEMENT_MDX_COMPONENT as never;
    });
  };
}
