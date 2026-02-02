import { MarkdownPlugin, remarkMdx } from "@platejs/markdown";
import { KEYS } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx],
      rules: {
        code_block: {
          // Override the default code block deserialization
          deserialize(mdastNode) {
            return {
              type: "code_block",
              lang: mdastNode.lang || "",
              // Capture the meta string here
              meta: mdastNode.meta || "",
              children: [{ text: mdastNode.value }],
            };
          },
          serialize(node) {
            // Flatten code-line children back into a single string for Markdown
            const value = node.children
              .map((line: any) => line.children?.[0]?.text ?? "")
              .join("\n");

            return {
              type: "code",
              lang: node.lang ?? "",
              meta: String(node.meta ?? ""),
              value: value,
            };
          },
        },
      },
    },
  }),
];
