"use client";

import * as React from "react";

import { YjsPlugin } from "@platejs/yjs/react";
import { type CursorOverlayData, useRemoteCursorOverlayPositions } from "@slate-yjs/react";
import { useEditorContainerRef, usePluginOption } from "platejs/react";

export function RemoteCursorOverlay() {
  const isSynced = usePluginOption(YjsPlugin, "_isSynced");

  if (!isSynced) {
    return null;
  }

  return <RemoteCursorOverlayContent />;
}

function RemoteCursorOverlayContent() {
  const containerRef = useEditorContainerRef();
  const [cursors] = useRemoteCursorOverlayPositions<CursorData>({
    containerRef: containerRef as never,
  });

  return (
    <>
      {cursors.map((cursor) => (
        <RemoteSelection key={cursor.clientId} {...cursor} />
      ))}
    </>
  );
}

function RemoteSelection({ caretPosition, data, selectionRects }: CursorOverlayData<CursorData>) {
  if (!data) {
    return null;
  }

  const selectionStyle: React.CSSProperties = {
    // Add a opacity to the background color
    backgroundColor: addAlpha(data.color, 0.5),
  };

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{ ...selectionStyle, ...position }}
        />
      ))}
      {caretPosition && <Caret data={data} caretPosition={caretPosition} />}
    </>
  );
}

type CursorData = {
  color: string;
  name: string;
};

function Caret({
  caretPosition,
  data,
}: Pick<CursorOverlayData<CursorData>, "caretPosition" | "data">) {
  return (
    <div
      className="absolute w-0.5 -translate-y-full bg-(--cursor-color,--color-primary)"
      style={
        {
          "--cursor-color": data?.color,
          ...caretPosition,
        } as object
      }
    >
      <div className="absolute top-0 whitespace-nowrap rounded rounded-bl-none px-1.5 py-0.5 text-white text-xs bg-(--cursor-color,--color-primary)">
        {data?.name}
      </div>
    </div>
  );
}

function addAlpha(hexColor: string, opacity: number): string {
  const normalized = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);

  return hexColor + normalized.toString(16).padStart(2, "0").toUpperCase();
}
