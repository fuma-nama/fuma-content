"use client";

import { ExitBreakPlugin } from "@platejs/utils";

export const ExitBreakKit = [
  ExitBreakPlugin.configure({
    shortcuts: {
      insert: { keys: "mod+enter" },
      insertBefore: { keys: "mod+shift+enter" },
    },
  }),
];
