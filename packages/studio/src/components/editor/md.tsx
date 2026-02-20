"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, type PlateEditor, usePlateEditor } from "platejs/react";
import { type ReactNode, Suspense, useEffect, useMemo, useRef, useTransition } from "react";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";
import { Spinner } from "../ui/spinner";
import { YjsPlugin } from "@platejs/yjs/react";
import { createEditorKit, useYjs } from "./yjs";
import { EditorKit } from "./editor-kit";

enum ConnectionStatus {
  Initial,
  Connecting,
  Connected,
}

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
  const [_pending, startTransition] = useTransition();
  const editor = usePlateEditor({
    plugins: useYjs ? useMemo(() => createEditorKit(documentId), [documentId]) : EditorKit,
    skipInitialization: true,
  });

  useEffect(() => {
    if (useYjs) {
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
    }

    if (connectionRef.current === ConnectionStatus.Initial) {
      connectionRef.current = ConnectionStatus.Connecting;

      startTransition(() => {
        editor.tf.init({
          value: editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue),
        });
        connectionRef.current = ConnectionStatus.Connected;
      });
    }
  }, [editor]);

  if (connectionRef.current !== ConnectionStatus.Connected) return;

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
      defer
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
