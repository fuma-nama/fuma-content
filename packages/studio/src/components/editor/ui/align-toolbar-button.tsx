"use client";

import type { Alignment } from "@platejs/basic-styles";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";
import { useEditorPlugin, useSelectionFragmentProp } from "platejs/react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ToolbarButton } from "../../ui/toolbar";

export const alignItems = [
  {
    icon: AlignLeftIcon,
    label: "Left",
    value: "left",
  },
  {
    icon: AlignCenterIcon,
    label: "Center",
    value: "center",
  },
  {
    icon: AlignRightIcon,
    label: "Right",
    value: "right",
  },
  {
    icon: AlignJustifyIcon,
    label: "Justify",
    value: "justify",
  },
];

export function AlignToolbarButton(props: React.ComponentProps<typeof DropdownMenu>) {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: "start",
      getProp: (node) => node.align,
    }) ?? "left";

  const [open, setOpen] = React.useState(false);
  const IconValue = alignItems.find((item) => item.value === value)?.icon ?? AlignLeftIcon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            tf.textAlign.setNodes(value as Alignment);
            editor.tf.focus();
          }}
        >
          {alignItems.map((item) => (
            <DropdownMenuRadioItem
              key={item.value}
              className="data-[state=checked]:bg-accent"
              value={item.value}
            >
              <item.icon className="text-muted-foreground" />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
