"use client";
import { type ComponentProps, lazy, Suspense } from "react";

const Editor = lazy(() => import("./mdx").then((mod) => ({ default: mod.MDXCodeEditor })));

export function MDXCodeEditorLazy(props: ComponentProps<typeof Editor>) {
  return (
    <Suspense
      fallback={
        <div className="p-2 text-sm font-mono flex items-center justify-center text-muted-foreground h-full bg-secondary border rounded-lg">
          Loading editor...
        </div>
      }
    >
      <Editor {...props} />
    </Suspense>
  );
}
