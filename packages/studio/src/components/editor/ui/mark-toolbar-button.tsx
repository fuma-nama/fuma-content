"use client";

import type * as React from "react";

import { ToolbarButton } from "../../ui/toolbar";
import { useMarkToolbarButton, useMarkToolbarButtonState } from "@platejs/utils/react";

export function MarkToolbarButton({
  clear,
  nodeType,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  nodeType: string;
  clear?: string[] | string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return <ToolbarButton {...props} {...buttonProps} />;
}
