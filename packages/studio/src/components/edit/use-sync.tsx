import { useRef, useState, useTransition } from "react";

export type Status = "sync" | "updated" | { type: "error"; message: string } | "updating";

export function useSync(onSyncCallback: () => void) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("sync");
  const timerRef = useRef<number | null>(null);

  return {
    status: isPending ? "updating" : status,
    onSync(syncAction?: () => void) {
      if (isPending) return;
      setStatus("updated");

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        startTransition(async () => {
          try {
            syncAction?.();
            await onSyncCallback();
            setStatus("sync");
          } catch (e) {
            setStatus({
              type: "error",
              message: Error.isError(e) ? e.message : "Failed to save document",
            });
          }
        });
      }, 500);
    },
  };
}
