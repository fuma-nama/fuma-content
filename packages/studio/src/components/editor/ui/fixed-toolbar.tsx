"use client";

import { cn } from "@/lib/utils";

import { Toolbar } from "../../ui/toolbar";

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        "sticky top-(--toolbar-offset,0) z-20 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60 [scrollbar-width:none]",
        props.className,
      )}
    />
  );
}
