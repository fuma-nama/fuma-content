"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, usePlateEditor } from "platejs/react";
import { useEffect } from "react";
import { EditorKit } from "@/components/editor/editor-kit";
import { SettingsDialog } from "@/components/editor/settings-dialog";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";

export function MDXEditor({ defaultValue }: { defaultValue: string }) {
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
    editor.tf.setValue(editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue));
  }, []);

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor />
      </EditorContainer>

      <SettingsDialog />
    </Plate>
  );
}
