"use client";
import type { SlateLeafProps } from "@platejs/core/static";

import { SlateLeaf } from "@platejs/core/static";

export function HighlightLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="mark" className="bg-highlight/30 text-inherit">
      {props.children}
    </SlateLeaf>
  );
}
