import { CheckIcon, CircleIcon, AlertCircleIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { Status } from "./use-sync";

export function StatusBar({ status }: { status: Status }) {
  return (
    <div className="sticky bottom-2 rounded-full bg-popover text-xs text-popover-foreground inline-flex items-center gap-1 px-3 py-1.5 border shadow-lg z-20 mx-auto">
      {status === "updating" ? (
        <>
          <Spinner className="text-primary" />
          <span className="text-muted-foreground">Saving</span>
        </>
      ) : status === "sync" ? (
        <>
          <CheckIcon className="size-4 text-green-400" />
          <span>In Sync</span>
        </>
      ) : status === "updated" ? (
        <>
          <CircleIcon className="size-4 fill-current stroke-transparent text-orange-400" />
          <p>Updated</p>
        </>
      ) : (
        <>
          <AlertCircleIcon className="size-4 text-destructive" />
          <p>{status.message}</p>
        </>
      )}
    </div>
  );
}
