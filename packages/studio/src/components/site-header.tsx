import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";
import { useSidebar } from "./app-sidebar";
import { Button } from "./ui/button";
import { SidebarIcon } from "lucide-react";

export function SiteHeader({ children }: { children?: ReactNode }) {
  const { open, setOpen } = useSidebar();
  return (
    <header className="flex h-10 top-0 shrink-0 items-center gap-2 border-b sticky bg-background z-30 px-3">
      <Button className="-mx-2" variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <SidebarIcon />
      </Button>
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      {children}
    </header>
  );
}
