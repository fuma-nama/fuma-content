"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import type { Value } from "platejs";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { type ReactNode, Suspense, use, useRef } from "react";
import { EditorKit } from "@/components/editor/editor-kit";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";
import { Spinner } from "../ui/spinner";

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
  const initializedRef = useRef(false);
  const editor = usePlateEditor({
    plugins: EditorKit,
    skipInitialization: true,
  });

  if (!initializedRef.current) {
    editor.tf.init({
      value: use(
        (mdMap[defaultValue] ??= new Promise((res) => {
          res(editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue));
        })),
      ),
    });
    initializedRef.current = true;
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

export function MDXEditorSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-muted-foreground bg-muted border p-3 rounded-xl">
          <Spinner />
          Loading Editor
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const MDXEditorContainer = EditorContainer;
export const MDXEditorView = Editor;
