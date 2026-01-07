"use client";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import { Suspense, type ReactNode } from "react";

export function BoundaryClient({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const fallback = (
    <div className="fixed flex items-center justify-center inset-0 bg-background z-50 text-sm text-muted-foreground gap-1">
      <Spinner />
      Loading
    </div>
  );

  if (!mounted) return fallback;

  return (
    <Suspense fallback={fallback} defer>
      {children}
    </Suspense>
  );
}
