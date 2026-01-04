"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import type { Value } from "platejs";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { type ReactNode, use, useRef } from "react";
import { EditorKit } from "@/components/editor/editor-kit";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";

const mdMap: Record<string, Promise<Value>> = {};

export function MDXEditor({
  defaultValue,
  onUpdate,
  children,
}: {
  defaultValue: string;
  onUpdate?: (options: { editor: PlateEditor; getMarkdown: () => string }) => void;
  children?: ReactNode;
}) {
  const isReadyRef = useRef(false);
  const editor = usePlateEditor({
    plugins: EditorKit,
    skipInitialization: true,
  });
  const deserilaizedDefault = use(
    (mdMap[defaultValue] ??= new Promise((res) => {
      res(editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue));
    })),
  );

  if (!isReadyRef.current) {
    editor.tf.init({
      value: deserilaizedDefault,
    });
    isReadyRef.current = true;
  }

  return (
    <Plate
      editor={editor}
      onValueChange={() => {
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
