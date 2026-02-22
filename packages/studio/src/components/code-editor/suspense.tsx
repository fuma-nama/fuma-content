import { type ComponentProps, type ReactNode, Suspense } from "react";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";

export function EditorSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<EditorFallback />}>{children}</Suspense>;
}

export function EditorFallback(props: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex justify-center items-center gap-2 text-muted-foreground bg-muted border-y p-3 flex-1",
        props.className,
      )}
    >
      <Spinner />
      Loading Editor
    </div>
  );
}
