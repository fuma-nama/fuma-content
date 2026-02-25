"use client";

import { Plate, usePlateEditor } from "platejs/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";
import { YjsPlugin } from "@platejs/yjs/react";
import { EditorKit } from "@/components/editor/editor-kit";
import { RemoteCursorOverlay } from "@/components/editor/ui/remote-cursor-overlay";
import { useHocuspocusProvider, useIsSync } from "@/lib/yjs/provider";
import * as Y from "yjs";
import { CursorEditor } from "@slate-yjs/core";

export function MDXEditor({ children }: { children?: (ctx: { ready: boolean }) => ReactNode }) {
  const provider = useHocuspocusProvider();
  const name = provider.configuration.name;
  const isSync = useIsSync();
  const [ready, setReady] = useState(false);
  const editor = usePlateEditor({
    plugins: useMemo(
      () => [
        ...EditorKit,
        YjsPlugin.configure({
          handlers: {
            onBlur() {
              CursorEditor.sendCursorPosition(editor as never, null);
            },
          },
          render: {
            afterEditable: RemoteCursorOverlay,
          },
          options: {
            // TODO: auth system
            cursors: {
              data: {
                name: "User Name",
                color: "#aabbcc",
              },
            },
            _isConnected: true,
            providers: [provider],
            awareness: provider.awareness,
            ydoc: provider.document,
            sharedType: provider.document.get("content", Y.XmlText),
          },
        }),
      ],
      [provider],
    ),
    skipInitialization: true,
  });

  useEffect(() => {
    if (!isSync || ready) return;

    void editor
      .getApi(YjsPlugin)
      .yjs.init({
        id: name,
        autoConnect: false,
        value: null,
      })
      .then(() => {
        setReady(true);
      });
  }, [name, editor, ready, isSync]);

  editor.setOption(YjsPlugin, "_isConnected", provider.isConnected);
  editor.setOption(YjsPlugin, "_isSynced", isSync);

  return (
    <Plate editor={editor}>
      {children
        ? children({ ready })
        : ready && (
            <MDXEditorContainer>
              <MDXEditorView />
            </MDXEditorContainer>
          )}
    </Plate>
  );
}

export const MDXEditorContainer = EditorContainer;
export const MDXEditorView = Editor;
