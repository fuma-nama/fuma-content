"use client";
import { useController } from "react-hook-form";
import { useState } from "react";
import Editor from "@monaco-editor/react";

export function JsonEditor({ fieldName }: { fieldName: string }) {
  const controller = useController({
    name: fieldName,
  });
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(() => {
    try {
      return JSON.stringify(controller.field.value, null, 2);
    } catch {
      return "{}";
    }
  });

  const handleChange = (newValue: string | undefined) => {
    const jsonValue = newValue ?? "";
    setValue(jsonValue);
    try {
      const parsed = JSON.parse(jsonValue);
      controller.field.onChange(parsed);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  return (
    <div className="flex flex-col bg-secondary text-secondary-foreground overflow-hidden border rounded-lg">
      <Editor
        height="240px"
        language="json"
        value={value}
        onChange={handleChange}
        theme="vs-dark"
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
