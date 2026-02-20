"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";
import { YjsPlugin } from "@platejs/yjs/react";
import { createEditorKit, useYjs } from "@/components/editor/yjs";
import { EditorKit } from "@/components/editor/editor-kit";
import type { Value } from "platejs";
import { use } from "react";

enum ConnectionStatus {
  Initial,
  Connecting,
  Connected,
}

const promiseMap: Record<string, Promise<Value>> = {};
export function MDXEditor({
  documentId,
  defaultValue,
  onUpdate,
  children,
}: {
  documentId: string;
  defaultValue: string;
  onUpdate?: (options: { editor: PlateEditor; getMarkdown: () => string }) => void;
  children?: ReactNode;
}) {
  // tract the connection status of editor, can be a ref because state update is already sent by `editor`
  const connectionRef = useRef(ConnectionStatus.Initial);
  const editor = usePlateEditor({
    plugins: useYjs ? useMemo(() => createEditorKit(documentId), [documentId]) : EditorKit,
    skipInitialization: true,
  });

  useEffect(() => {
    if (!useYjs) return;
    const yjsApi = editor.getApi(YjsPlugin).yjs;

    if (connectionRef.current === ConnectionStatus.Initial) {
      connectionRef.current = ConnectionStatus.Connecting;

      void yjsApi.init({
        id: documentId,
        value: editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue),
        onReady() {
          connectionRef.current = ConnectionStatus.Connected;
        },
      });
    }

    return () => {
      if (connectionRef.current === ConnectionStatus.Connected) yjsApi.destroy();
    };
  }, [editor]);

  if (!useYjs && connectionRef.current === ConnectionStatus.Initial) {
    connectionRef.current = ConnectionStatus.Connecting;

    const value = use(
      (promiseMap[defaultValue] ??= new Promise((res) => {
        res(editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue));
      })),
    );
    editor.tf.init({
      value,
    });
    connectionRef.current = ConnectionStatus.Connected;
  }

  return (
    <Plate
      editor={editor}
      onValueChange={() => {
        if (connectionRef.current === ConnectionStatus.Connected)
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
