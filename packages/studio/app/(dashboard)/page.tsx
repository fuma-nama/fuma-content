import { AppWindowIcon } from "lucide-react";

export default async function Page() {
  return (
    <div className="flex-1 p-2">
      <div className="flex flex-col size-full items-center justify-center bg-muted text-muted-foreground p-6 rounded-xl border">
        <AppWindowIcon className="size-14 mb-2" />
        <p className="text-sm font-medium">View & Manage Collections</p>
      </div>
    </div>
  );
}
