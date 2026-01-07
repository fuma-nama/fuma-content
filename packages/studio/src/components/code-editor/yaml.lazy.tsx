"use client";
import { type ComponentProps, lazy, Suspense } from "react";

const Editor = lazy(() => import("./yaml").then((mod) => ({ default: mod.YamlEditor })));

export function YamlEditorLazy(props: ComponentProps<typeof Editor>) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col bg-secondary text-secondary-foreground overflow-hidden border rounded-lg">
          <div className="p-2 h-[240px] text-sm font-mono flex items-center justify-center text-muted-foreground">
            Loading editor...
          </div>
        </div>
      }
    >
      <Editor {...props} />
    </Suspense>
  );
}
