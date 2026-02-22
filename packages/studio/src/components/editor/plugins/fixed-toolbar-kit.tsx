"use client";

import { createPlatePlugin } from "platejs/react";
import { FixedToolbar } from "@/components/editor/ui/fixed-toolbar";

export const FixedToolbarKit = [
  createPlatePlugin({
    key: "fixed-toolbar",
    render: {
      beforeEditable: () => <FixedToolbar />,
    },
  }),
];
