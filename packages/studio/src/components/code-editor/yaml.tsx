"use client";
import { useEffect, useEffectEvent, useState } from "react";
import Editor from "@monaco-editor/react";
import { load, dump } from "js-yaml";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { MonacoBinding } from "y-monaco";
import { useHocuspocusProvider, useIsSync } from "@/lib/yjs/provider";
import { applyJsonObject } from "mutative-yjs";
import type * as Y from "yjs";
import "./monaco";

export function YamlEditor({ className, field }: { field: string; className?: string }) {
  const { resolvedTheme } = useTheme();
  const provider = useHocuspocusProvider();
  const [error, setError] = useState<string | null>(null);
  const isSync = useIsSync();
  const ydata = provider.document.getMap(field);
  const ytext = provider.document.getText(`${field}:text`);

  if (isSync && ytext.length === 0) {
    ytext.insert(0, dump(ydata.toJSON()));
  }

  const onTextUpdate = useEffectEvent((_events: Y.YEvent<any>[], t: Y.Transaction) => {
    if (!t.local) return;

    try {
      applyJsonObject(ydata, load(ytext.toString()) as never);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  });

  useEffect(() => {
    ytext.observeDeep(onTextUpdate);
    return () => {
      ytext.unobserveDeep(onTextUpdate);
    };
  }, [ytext]);

  return (
    <div
      className={cn(
        "flex flex-col bg-secondary text-secondary-foreground overflow-hidden border rounded-lg",
        className,
      )}
    >
      <Editor
        height="240px"
        language="yaml"
        onMount={(editor) => {
          new MonacoBinding(ytext, editor.getModel()!, new Set([editor]), provider.awareness);
        }}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        options={{
          minimap: { enabled: false },
          padding: {
            top: 20,
            bottom: 20,
          },
          fontSize: 14,
          lineHeight: 1.428571,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
      {error && (
        <p className="p-2 text-sm font-mono border-t font-semibold bg-card text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
