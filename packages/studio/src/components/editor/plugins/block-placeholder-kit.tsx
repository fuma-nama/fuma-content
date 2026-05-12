"use client";

import { KEYS } from "@platejs/utils";
import { BlockPlaceholderPlugin } from "@platejs/utils/react";

export const BlockPlaceholderKit = [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        "before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]",
      placeholders: {
        [KEYS.p]: "Type something...",
      },
      query: ({ path }) => path.length === 1,
    },
  }),
];
