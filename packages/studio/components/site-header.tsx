import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-10 m-2 top-2 shrink-0 items-center gap-2 border rounded-lg sticky bg-popover text-popover-foreground z-30 px-4 shadow-md">
      <SidebarTrigger className="-mx-2" />
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      {children}
    </header>
  );
}
