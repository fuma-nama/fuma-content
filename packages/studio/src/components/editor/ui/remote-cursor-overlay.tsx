"use client";

import * as React from "react";

import { YjsPlugin } from "@platejs/yjs/react";
import {
  type CursorOverlayData,
  getCursorRange,
  UseRemoteCursorOverlayPositionsOptions,
  useRemoteCursorStates,
} from "@slate-yjs/react";
import { PlateEditor, useEditorContainerRef, useEditorRef, usePluginOption } from "platejs/react";
import type { CursorData } from "@/lib/yjs";
import { FROZEN_EMPTY_ARRAY } from "@platejs/selection/react";

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

function Caret({
  caretPosition,
  data,
}: Pick<CursorOverlayData<CursorData>, "caretPosition" | "data">) {
  return (
    <div
      className="absolute w-0.5 bg-(--cursor-color,--color-primary)"
      style={
        {
          "--cursor-color": data?.color,
          ...caretPosition,
        } as object
      }
    >
      <div className="absolute top-0 whitespace-nowrap rounded-md -translate-y-full px-1.5 py-0.5 text-white text-xs bg-(--cursor-color,--color-primary)">
        {data?.name}
      </div>
    </div>
  );
}

function addAlpha(hexColor: string, opacity: number): string {
  const normalized = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);

  return hexColor + normalized.toString(16).padStart(2, "0").toUpperCase();
}

function useRemoteCursorOverlayPositions<
  TCursorData extends Record<string, unknown>,
  TContainer extends HTMLElement = HTMLDivElement,
>({
  containerRef,
  shouldGenerateOverlay,
}: UseRemoteCursorOverlayPositionsOptions<TContainer> = {}) {
  const editor = useEditorRef();
  const cursorStates = useRemoteCursorStates<TCursorData>();
  const [_, update] = React.useState(0);
  const overlayPositionCache = React.useRef(new WeakMap<Range, OverlayPosition>());
  const [overlayPositions, setOverlayPositions] = React.useState<Record<string, OverlayPosition>>(
    {},
  );

  React.useLayoutEffect(() => {
    if (containerRef && !containerRef.current) {
      return;
    }

    const containerRect = containerRef?.current?.getBoundingClientRect();
    const xOffset = containerRect?.x ?? 0;
    const yOffset = containerRect?.y ?? 0;

    const updated = Object.fromEntries(
      Object.entries(cursorStates).map(([key, state]) => {
        const range = state.relativeSelection && getCursorRange(editor as never, state);

        if (!range) {
          return [key, FROZEN_EMPTY_ARRAY];
        }

        const cached = overlayPositionCache.current.get(range);
        if (cached) {
          return [key, cached];
        }

        const overlayPosition = getOverlayPosition(editor as never, range, {
          xOffset,
          yOffset,
          shouldGenerateOverlay,
        });
        overlayPositionCache.current.set(range, overlayPosition);
        return [key, overlayPosition];
      }),
    );

    setOverlayPositions(updated);
  }, [cursorStates]);

  const overlayData = React.useMemo<CursorOverlayData<TCursorData>[]>(
    () =>
      Object.entries(cursorStates).map(([clientId, state]) => {
        const range = state.relativeSelection && getCursorRange(editor as never, state);
        const overlayPosition = overlayPositions[clientId];

        return {
          ...state,
          range,
          caretPosition: overlayPosition?.caretPosition ?? null,
          selectionRects: overlayPosition?.selectionRects ?? FROZEN_EMPTY_ARRAY,
        };
      }),
    [cursorStates, editor, overlayPositions],
  );

  const refresh = React.useCallback(() => {
    overlayPositionCache.current = new WeakMap();
    update((prev) => prev + 1);
  }, []);

  return [overlayData, refresh] as const;
}

import { BaseRange, Editor, Path, Range, Text } from "slate";
import { ReactEditor } from "slate-react";

export type SelectionRect = {
  width: number;
  height: number;
  top: number;
  left: number;
};

export type CaretPosition = {
  height: number;
  top: number;
  left: number;
};

export type OverlayPosition = {
  caretPosition: CaretPosition | null;
  selectionRects: SelectionRect[];
};

export type GetSelectionRectsOptions = {
  xOffset: number;
  yOffset: number;
  shouldGenerateOverlay?: (node: Text, path: Path) => boolean;
};

export function getOverlayPosition(
  editor: ReactEditor & PlateEditor,
  range: BaseRange,
  { yOffset, xOffset, shouldGenerateOverlay }: GetSelectionRectsOptions,
): OverlayPosition {
  const [start, end] = Range.edges(range);
  const domRange = editor.api.toDOMRange(range);
  if (!domRange) {
    return {
      caretPosition: null,
      selectionRects: [],
    };
  }

  const selectionRects: SelectionRect[] = [];
  const nodeIterator = Editor.nodes(editor, {
    at: range,
    match: (n, p) => Text.isText(n) && (!shouldGenerateOverlay || shouldGenerateOverlay(n, p)),
  });

  let caretPosition: CaretPosition | null = null;
  const isBackward = Range.isBackward(range);
  for (const [node, path] of nodeIterator) {
    const domNode = ReactEditor.toDOMNode(editor, node);

    const isStartNode = Path.equals(path, start.path);
    const isEndNode = Path.equals(path, end.path);

    let clientRects: DOMRectList | null = null;
    if (isStartNode || isEndNode) {
      const nodeRange = document.createRange();
      nodeRange.selectNode(domNode);

      if (isStartNode) {
        nodeRange.setStart(domRange.startContainer, domRange.startOffset);
      }
      if (isEndNode) {
        nodeRange.setEnd(domRange.endContainer, domRange.endOffset);
      }

      clientRects = nodeRange.getClientRects();
    } else {
      clientRects = domNode.getClientRects();
    }

    const isCaret = isBackward ? isStartNode : isEndNode;
    for (let i = 0; i < clientRects.length; i++) {
      const clientRect = clientRects.item(i);
      if (!clientRect) {
        continue;
      }

      const isCaretRect = isCaret && (isBackward ? i === 0 : i === clientRects.length - 1);

      const top = clientRect.top - yOffset;
      const left = clientRect.left - xOffset;

      if (isCaretRect) {
        caretPosition = {
          height: clientRect.height,
          top,
          left: left + (isBackward || Range.isCollapsed(range) ? 0 : clientRect.width),
        };
      }

      selectionRects.push({
        width: clientRect.width,
        height: clientRect.height,
        top,
        left,
      });
    }
  }

  return {
    selectionRects,
    caretPosition,
  };
}
