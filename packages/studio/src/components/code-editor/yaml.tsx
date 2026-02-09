"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { load, dump } from "js-yaml";
import { useTheme } from "next-themes";
import "./monaco";

export function YamlEditor({
  defaultValue,
  onValueChange,
}: {
  defaultValue: unknown;
  onValueChange: (v: unknown) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(() => {
    try {
      return dump(defaultValue);
    } catch {
      return "";
    }
  });

  return (
    <div className="flex flex-col bg-secondary text-secondary-foreground overflow-hidden border rounded-lg">
      <Editor
        height="240px"
        language="yaml"
        value={value}
        onChange={(newValue = "") => {
          setValue(newValue);
          try {
            const parsed = load(newValue);
            onValueChange(parsed);
            setError(null);
          } catch (e) {
            if (e instanceof Error) {
              setError(e.message);
            }
          }
        }}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        loading={
          <pre className="ps-17 py-5 text-sm size-full">
            <code>{value}</code>
          </pre>
        }
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
