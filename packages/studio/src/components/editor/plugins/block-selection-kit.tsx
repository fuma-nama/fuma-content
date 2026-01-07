"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { getPluginTypes, isHotkey, KEYS } from "platejs";

import { BlockSelection } from "@/components/editor/ui/block-selection";
import { createPlatePlugin } from "platejs/react";

const InlineSelectionPlugin = createPlatePlugin((editor) => ({
  key: "inline-selection",
  priority: 200,
  handlers: {
    onKeyDown({ event: e }) {
      const marks = editor.api.marks();
      if (!marks) return;

      if (isHotkey("escape")(e) && KEYS.sub in marks) {
        editor.tf.removeMark(KEYS.sub);
        e.preventDefault();
        return true;
      }

      if (isHotkey("escape")(e) && KEYS.sup in marks) {
        editor.tf.removeMark(KEYS.sup);
        e.preventDefault();
        return true;
      }
    },
  },
}));

export const BlockSelectionKit = [
  InlineSelectionPlugin,
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element) =>
        !getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(element.type),
      onKeyDownSelecting: (editor, e) => {
        if (isHotkey("mod+j")(e)) {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      },
    },
    render: {
      belowRootNodes: (props) => {
        if (!props.attributes.className?.includes("slate-selectable")) return null;

        return <BlockSelection {...(props as any)} />;
      },
    },
  })),
];
