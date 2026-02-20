import { YjsPlugin } from "@platejs/yjs/react";
import { EditorKit } from "./editor-kit";
import { RemoteCursorOverlay } from "./ui/remote-cursor-overlay";
import type { PlatePlugin } from "platejs/react";

export const useYjs = import.meta.env.VITE_STUDIO_YJS === "1";

export function createEditorKit(documentId: string): PlatePlugin[] {
  return [
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
              url: "ws://localhost:8888",
            },
          },
        ],
      },
    }),
  ] as PlatePlugin[];
}
