"use client";

import { createPlatePlugin } from "@platejs/core/react";

import { FloatingToolbar } from "@/components/editor/ui/floating-toolbar";
import { FloatingToolbarButtons } from "@/components/editor/ui/floating-toolbar-buttons";

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: "floating-toolbar",
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];
