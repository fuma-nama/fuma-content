import { useHocuspocusProvider, useStatus } from "@/lib/yjs/provider";
import { WebSocketStatus } from "@hocuspocus/provider";
import { cn } from "@/lib/utils";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "../ui/button";

export function StatusBar() {
  const status = useStatus();
  const provider = useHocuspocusProvider();
  const [isSync, setIsSync] = useState(true);
  const timerRef = useRef<number | null>(null);

  const onUnsyncedChanges = useEffectEvent(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsSync(!provider.hasUnsyncedChanges);
    }, 100);
  });

  useEffect(() => {
    provider.on("unsyncedChanges", onUnsyncedChanges);
    return () => {
      provider.off("unsyncedChanges", onUnsyncedChanges);
    };
  }, []);

  return (
    <div className="sticky mt-auto w-full bottom-0 bg-background border-t flex gap-2 px-4 justify-end h-10 z-20">
      <div className="flex min-w-36 items-center font-mono text-xs text-muted-foreground gap-1.5">
        <div
          className={cn(
            "transition-colors size-2.5 rounded-full",
            status === WebSocketStatus.Connected && "bg-green-400",
            status === WebSocketStatus.Connecting && "bg-orange-400",
            status === WebSocketStatus.Disconnected && "bg-red-400",
          )}
        />
        {`${status} ⋅ ${isSync ? "saved" : "saving"}`}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="my-auto text-muted-foreground -me-1.5"
        aria-label="Settings"
      >
        <Settings />
      </Button>
    </div>
  );
}
