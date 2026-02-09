"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import "./monaco";

export function MDXCodeEditor({
  defaultValue,
  onValueChange,
}: {
  defaultValue: string;
  onValueChange: (value: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState(defaultValue);

  return (
    <Editor
      language="mdx"
      value={value}
      onChange={(value = "") => {
        setValue(value);
        onValueChange(value);
      }}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      loading={
        <pre className="ps-17 py-5 text-sm size-full">
          <code>{value}</code>
        </pre>
      }
      className="bg-secondary text-secondary-foreground overflow-hidden border rounded-lg"
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
  );
}
