"use client";
import { type ComponentProps } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import "./monaco";
import { cn } from "@/lib/utils";
import { MonacoBinding } from "y-monaco";
import { useHocuspocusProvider } from "@/lib/yjs/provider";
import { Text } from "yjs";

export function MDXCodeEditor({
  field,
  ...rest
}: {
  field: string;
  className?: string;
  wrapperProps?: ComponentProps<"div">;
}) {
  const { resolvedTheme } = useTheme();
  const provider = useHocuspocusProvider();

  return (
    <Editor
      language="mdx"
      onMount={(editor) => {
        new MonacoBinding(
          provider.document.get(field, Text),
          editor.getModel()!,
          new Set([editor]),
          provider.awareness,
        );
      }}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      {...rest}
      className={cn(
        "bg-secondary text-secondary-foreground overflow-hidden border rounded-lg",
        rest.className,
      )}
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
