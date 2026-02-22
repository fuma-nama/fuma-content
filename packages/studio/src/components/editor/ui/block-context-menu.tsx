"use client";

import * as React from "react";

import { AIChatPlugin } from "@platejs/ai/react";
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from "@platejs/selection/react";
import { KEYS } from "platejs";
import { useEditorPlugin, usePlateState, usePluginOption } from "platejs/react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlignCenterIcon,
  ArrowLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { turnIntoItems } from "./turn-into-toolbar-button";
import { alignItems } from "./align-toolbar-button";

type Value = "askAI" | null;

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const [readOnly] = usePlateState("readOnly");
  const openId = usePluginOption(BlockMenuPlugin, "openId");
  const posRef = React.useRef<{ x: number; y: number } | undefined>(undefined);

  const handleTurnInto = (type: string) => {
    editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes()
      .forEach(([node, path]) => {
        if (node[KEYS.listType]) {
          editor.tf.unsetNodes([KEYS.listType, "indent"], {
            at: path,
          });
        }

        editor.tf.toggleBlock(type, { at: path });
      });
  };
  const handleAlign = (align: "center" | "left" | "right") => {
    editor.getTransforms(BlockSelectionPlugin).blockSelection.setNodes({ align });
  };

  return (
    <ContextMenu
      open={openId === BLOCK_CONTEXT_MENU_ID}
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        } else {
          api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, posRef.current);
        }
      }}
    >
      <ContextMenuTrigger
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled =
            dataset?.slateEditor === "true" ||
            readOnly ||
            dataset?.plateOpenContextMenu === "false";

          if (disabled) return event.preventDefault();
          posRef.current = {
            x: event.clientX,
            y: event.clientY,
          };
        }}
        render={<div className="flex flex-col flex-1">{children}</div>}
      />

      <ContextMenuContent
        className="w-64"
        finalFocus={() => {
          editor.getApi(BlockSelectionPlugin).blockSelection.focus();

          if (value === "askAI") {
            editor.getApi(AIChatPlugin).aiChat.show();
          }

          setValue(null);
        }}
      >
        <ContextMenuGroup>
          <ContextMenuItem
            onClick={() => {
              setValue("askAI");
            }}
          >
            <SparklesIcon className="text-muted-foreground" />
            Ask AI
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.removeNodes();
              editor.tf.focus();
            }}
          >
            <TrashIcon className="text-muted-foreground" />
            Delete
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.duplicate();
            }}
          >
            <CopyIcon className="text-muted-foreground" />
            Duplicate
            {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ArrowLeftRightIcon className="text-muted-foreground" />
              Turn into
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {turnIntoItems.map((item) => (
                <ContextMenuItem key={item.value} onClick={() => handleTurnInto(item.value)}>
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>

        <ContextMenuGroup>
          <ContextMenuItem
            onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(1)}
          >
            <ChevronRightIcon className="text-muted-foreground" />
            Indent
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(-1)}
          >
            <ChevronLeftIcon className="text-muted-foreground" />
            Outdent
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <AlignCenterIcon className="text-muted-foreground" />
              Align
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {alignItems.map((item) => (
                <ContextMenuItem key={item.value} onClick={() => handleAlign(item.value as never)}>
                  <item.icon className="text-muted-foreground" />
                  {item.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
