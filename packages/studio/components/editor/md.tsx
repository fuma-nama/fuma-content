"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { EditorKit } from "@/components/editor/editor-kit";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";

export function MDXEditor({
  defaultValue,
  onUpdate,
  children,
}: {
  defaultValue: string;
  onUpdate?: (options: { editor: PlateEditor; getMarkdown: () => string }) => void;
  children?: ReactNode;
}) {
  const [_, startTransition] = useTransition();
  const [isReady, setIsReady] = useState(false);
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: [
      {
        type: "p",
        children: [{ text: defaultValue }],
      },
    ],
  });

  useEffect(() => {
    startTransition(() => {
      editor.tf.setValue(editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue));
      setIsReady(true);
    });
    return () => setIsReady(false);
  }, []);

  return (
    <Plate
      editor={editor}
      onValueChange={() => {
        if (!isReady) return;

        onUpdate?.({
          editor,
          getMarkdown() {
            return editor.getApi(MarkdownPlugin).markdown.serialize();
          },
        });
      }}
    >
      {children ?? (
        <MDXEditorContainer>
          <MDXEditorView />
        </MDXEditorContainer>
      )}
    </Plate>
  );
}

export const MDXEditorContainer = EditorContainer;
export const MDXEditorView = Editor;
