"use client";

import type { PlateLeafProps } from "@platejs/core/react";

import { PlateLeaf } from "@platejs/core/react";

export function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="bg-highlight/30 text-inherit">
      {props.children}
    </PlateLeaf>
  );
}
