"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, type PlateEditor, usePlateEditor, usePluginOption } from "platejs/react";
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Editor, EditorContainer } from "@/components/editor/ui/editor";
import { YjsPlugin } from "@platejs/yjs/react";
import { getUrl } from "@/components/editor/yjs";
import { EditorKit } from "@/components/editor/editor-kit";
import { RemoteCursorOverlay } from "@/components/editor/ui/remote-cursor-overlay";

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
  // it is found that re-mounting the entire `<Plate />` can fix the issue where using Y.js with Plate.js would cause editor to render nothing.
  // there is something wrong with upstream integration, but it works for now.
  const [rootId, setRootId] = useState(0);
  const editor = usePlateEditor({
    plugins: useMemo(
      () => [
        ...EditorKit,
        YjsPlugin.configure({
          render: {
            afterEditable: RemoteCursorOverlay,
          },
          options: {
            // Configure local user cursor appearance
            cursors: {
              data: {
                name: "User Name",
                color: "#aabbcc",
              },
            },
            providers: [
              {
                type: "hocuspocus",
                options: {
                  name: documentId,
                  url: getUrl(),
                },
              },
            ],
          },
        }),
      ],
      [documentId],
    ),
    skipInitialization: true,
  });

  useEffect(() => {
    if (connectionRef.current === ConnectionStatus.Initial) {
      connectionRef.current = ConnectionStatus.Connecting;
      void editor.getApi(YjsPlugin).yjs.init({
        id: documentId,
        value: editor.getApi(MarkdownPlugin).markdown.deserialize(defaultValue),
        onReady() {
          setRootId((prev) => prev + 1);
          connectionRef.current = ConnectionStatus.Connected;
        },
      });
    }

    return () => {
      if (connectionRef.current === ConnectionStatus.Connected) {
        connectionRef.current = ConnectionStatus.Initial;
        editor.getApi(YjsPlugin).yjs.destroy();
      }
    };
  }, [documentId, editor]);

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
      <Fragment key={rootId}>
        {children ?? (
          <MDXEditorContainer>
            <MDXEditorView />
          </MDXEditorContainer>
        )}
      </Fragment>
    </Plate>
  );
}

export const MDXEditorContainer = EditorContainer;
export const MDXEditorView = Editor;
