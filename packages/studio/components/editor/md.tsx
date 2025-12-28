"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { useEffect, useState, useTransition } from "react";
import { EditorKit } from "@/components/editor/editor-kit";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";

export function MDXEditor({
  defaultValue,
  onUpdate,
}: {
  defaultValue: string;
  onUpdate?: (options: { editor: PlateEditor; getMarkdown: () => string }) => void;
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
      <EditorContainer>
        <Editor />
      </EditorContainer>
    </Plate>
  );
}
