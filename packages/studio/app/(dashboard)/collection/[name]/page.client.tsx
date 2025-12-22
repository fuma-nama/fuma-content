"use client";

import type { Value } from "platejs";

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { Plate, usePlateEditor } from "platejs/react";

import { Editor, EditorContainer } from "@/components/editor/editor";
import { MarkToolbarButton } from "@/components/editor/ui/mark-toolbar-button";
import { Toolbar } from "@/components/ui/toolbar";

const initialValue: Value = [
  {
    type: "p",
    children: [
      { text: "Hello! Try out the " },
      { text: "bold", bold: true },
      { text: ", " },
      { text: "italic", italic: true },
      { text: ", and " },
      { text: "underline", underline: true },
      { text: " formatting." },
    ],
  },
];

export function MDXEditor() {
  const editor = usePlateEditor({
    plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin], // Add the mark plugins
    value: initialValue, // Set initial content
  });

  return (
    <Plate editor={editor}>
      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
        <Toolbar className="scrollbar-hide sticky top-0 z-50 w-full justify-start overflow-x-auto border-b border-b-border bg-card p-1">
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            B
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            I
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            U
          </MarkToolbarButton>
        </Toolbar>
        <EditorContainer>
          <Editor placeholder="Type your amazing content here..." />
        </EditorContainer>
      </div>
    </Plate>
  );
}
