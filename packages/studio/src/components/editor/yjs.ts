import { YjsPlugin } from "@platejs/yjs/react";
import { EditorKit } from "./editor-kit";
import { RemoteCursorOverlay } from "./ui/remote-cursor-overlay";
import type { PlatePlugin } from "platejs/react";

export function createEditorKit(documentId: string): PlatePlugin[] {
  return [...EditorKit] as PlatePlugin[];
}

export function getUrl() {
  if (import.meta.env.DEV) return "ws://localhost:8080/hocuspocus";

  if (typeof window === "undefined") return "";
  const url = new URL("/hocuspocus", window.location.href);
  url.protocol = url.protocol === "https" ? "wss" : "ws";
  return url.href;
}
