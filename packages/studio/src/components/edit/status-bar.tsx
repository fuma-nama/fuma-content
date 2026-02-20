import { CheckIcon, CircleIcon, AlertCircleIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { Status } from "./use-sync";

export function StatusBar({ status }: { status: Status }) {
  return (
    <div className="sticky mt-auto w-full bottom-0 bg-background border-t flex gap-2 px-4 h-10 z-20">
      <div className="flex items-center font-mono text-xs text-muted-foreground gap-1.5 ms-auto">
        {status === "updating" ? (
          <>
            <Spinner className="text-primary" />
            <span className="text-muted-foreground">Saving</span>
          </>
        ) : status === "sync" ? (
          <>
            <CheckIcon className="size-3 text-green-400" />
            <span>In Sync</span>
          </>
        ) : status === "updated" ? (
          <>
            <CircleIcon className="size-3 fill-current stroke-transparent text-orange-400" />
            <p>Updated</p>
          </>
        ) : (
          <>
            <AlertCircleIcon className="size-3 text-destructive" />
            <p>{status.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
