import { MarkdownPlugin, remarkMdx } from "@platejs/markdown";
import { getPluginType, KEYS, TText } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx],
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
      },
    },
  }),
];
