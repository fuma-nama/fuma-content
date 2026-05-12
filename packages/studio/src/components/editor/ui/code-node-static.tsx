"use client";
import type { SlateLeafProps } from "@platejs/core/static";

import { SlateLeaf } from "@platejs/core/static";

export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf
      {...props}
      as="code"
      className="whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm"
    >
      {props.children}
    </SlateLeaf>
  );
}
