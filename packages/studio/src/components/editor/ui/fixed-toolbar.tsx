"use client";

import { cn } from "@/lib/utils";

import { Toolbar } from "../../ui/toolbar";

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        "sticky top-(--toolbar-offset,0) z-30 w-full justify-between overflow-x-auto border-b border-b-border bg-background p-1 [scrollbar-width:none]",
        props.className,
      )}
    />
  );
}
