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

const items = [
  {
    icon: AlignLeftIcon,
    value: "left",
  },
  {
    icon: AlignCenterIcon,
    value: "center",
  },
  {
    icon: AlignRightIcon,
    value: "right",
  },
  {
    icon: AlignJustifyIcon,
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
  const IconValue = items.find((item) => item.value === value)?.icon ?? AlignLeftIcon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            tf.textAlign.setNodes(value as Alignment);
            editor.tf.focus();
          }}
        >
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="pl-2 data-[state=checked]:bg-accent"
              value={itemValue}
            >
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
