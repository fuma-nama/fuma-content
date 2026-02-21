import { type ReactNode, Suspense } from "react";
import { Spinner } from "../ui/spinner";

export function EditorSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center gap-2 text-muted-foreground bg-muted border-y p-3 flex-1">
          <Spinner />
          Loading Editor
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
