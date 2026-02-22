import {
  convertChildrenDeserialize,
  convertNodesSerialize,
  MarkdownPlugin,
  remarkMdx,
} from "@platejs/markdown";
import { getPluginType, KEYS, TText } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import {
  ELEMENT_MDX_COMPONENT,
  ELEMENT_UNKNOWN_NODE,
  type MdxComponentElement,
  type UnknownNode,
} from "../types";
import type { Transformer } from "unified";
import type { BlockContent, Root } from "mdast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx";

interface UnknownNodeElement {
  type: typeof ELEMENT_UNKNOWN_NODE;
  raw: BlockContent;
}

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
        [ELEMENT_UNKNOWN_NODE]: {
          deserialize: (mdastNode: UnknownNodeElement): UnknownNode => ({
            type: ELEMENT_UNKNOWN_NODE,
            raw: mdastNode.raw,
            md: "value" in mdastNode && typeof mdastNode.value === "string" ? mdastNode.value : "",
            children: [],
          }),
          serialize: (node: UnknownNode) => node.raw,
        },

        [ELEMENT_MDX_COMPONENT]: {
          deserialize(mdastNode: MdxJsxTextElement, deco, options): MdxComponentElement {
            const element: MdxComponentElement = {
              children: convertChildrenDeserialize(mdastNode.children, deco, options),
              element: mdastNode.name,
              customProps: {},
              unserializableProps: [],
              type: ELEMENT_MDX_COMPONENT,
            };
            for (const attr of mdastNode.attributes) {
              if (attr.type === "mdxJsxAttribute" && isMdxPropValueSupported(attr.value)) {
                element.customProps[attr.name] = attr.value;
              } else {
                element.unserializableProps.push(attr);
              }
            }

            return element;
          },
          serialize(node: MdxComponentElement, options): MdxJsxFlowElement {
            const element: MdxJsxFlowElement = {
              type: "mdxJsxFlowElement",
              attributes: [],
              name: node.element,
              children: convertNodesSerialize(node.children, options) as never[],
            };
            for (const [k, v] of Object.entries(node.customProps)) {
              element.attributes.push({
                type: "mdxJsxAttribute",
                name: k,
                value: v as string,
              });
            }
            element.attributes.push(...node.unserializableProps);
            return element;
          },
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
    visit(
      tree,
      [
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxjsEsm",
        "mdxFlowExpression",
        "mdxTextExpression",
      ],
      (node) => {
        switch (node.type) {
          case "mdxFlowExpression":
          case "mdxTextExpression":
          case "mdxjsEsm": {
            Object.assign(node, { type: ELEMENT_UNKNOWN_NODE, raw: { ...node } });
            return "skip";
          }
          case "mdxJsxFlowElement":
          case "mdxJsxTextElement":
            if (node.name && supportedNodeTypes.has(node.name)) return;
            node.type = ELEMENT_MDX_COMPONENT as never;
        }
      },
    );
  };
}

export function isMdxPropValueSupported(value: unknown) {
  return (
    typeof value === "string" || typeof value === "number" || value === null || value === undefined
  );
}
