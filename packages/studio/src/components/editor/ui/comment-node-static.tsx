"use client";

import type { TCommentText } from "@platejs/utils";
import type { SlateLeafProps } from "@platejs/core/static";

import { SlateLeaf } from "@platejs/core/static";

export function CommentLeafStatic(props: SlateLeafProps<TCommentText>) {
  return (
    <SlateLeaf {...props} className="border-b-2 border-b-highlight/35 bg-highlight/15">
      {props.children}
    </SlateLeaf>
  );
}
