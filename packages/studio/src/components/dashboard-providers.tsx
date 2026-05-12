"use client";

import { useMounted } from "@/hooks/use-mounted";
import { DocId } from "@/lib/yjs";
import { WebsocketProvider, HocuspocusContextProvider, useIsSync } from "@/lib/yjs/provider";
import { type ReactNode, Activity } from "react";
import { Toaster } from "sonner";
import { SidebarProvider, AppSidebar } from "./app-sidebar";
import { ClientContextProvider } from "./collection/context";
import { Spinner } from "./ui/spinner";
import type { ClientContext } from "@/lib/content";

export function DashboardProviders({
  clientContexts,
  children,
}: {
  clientContexts: Map<string, ClientContext>;

  children: ReactNode;
}) {
  return (
    <ClientContextProvider contexts={clientContexts}>
      <SidebarProvider>
        <WebsocketProvider>
          <HocuspocusContextProvider name={DocId.root}>
            <ClientBoundary>
              <AppSidebar>{children}</AppSidebar>
              <Toaster />
            </ClientBoundary>
          </HocuspocusContextProvider>
        </WebsocketProvider>
      </SidebarProvider>
    </ClientContextProvider>
  );
}

function ClientBoundary({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const isSync = useIsSync();
  const ready = isSync && mounted;

  return (
    <>
      <Activity mode={ready ? "visible" : "hidden"}>{children}</Activity>
      {!ready && (
        <div className="fixed flex items-center justify-center inset-0 bg-background z-50 text-sm text-muted-foreground gap-1">
          <Spinner />
          Loading
        </div>
      )}
    </>
  );
}
