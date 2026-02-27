import { AppSidebar, SidebarProvider } from "@/components/app-sidebar";
import { ClientContextProvider } from "@/components/collection/context";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import { ClientContext, studioHook } from "@/lib/content";
import { Route } from "./+types/layout";
import { Outlet } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import { Activity, type ReactNode } from "react";
import { HocuspocusContextProvider, useIsSync, WebsocketProvider } from "@/lib/yjs/provider";
import { DocId } from "@/lib/yjs";

export async function loader() {
  const core = await getCore();
  const collections = core.getCollections(true);
  const clientContexts = new Map<string, ClientContext>();
  for (const collection of collections) {
    const { client } = collection.pluginHook(studioHook);
    if (client) {
      clientContexts.set(collection.name, await client());
    }
  }

  return {
    clientContexts,
  };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <ClientContextProvider contexts={loaderData.clientContexts}>
      <SidebarProvider>
        <WebsocketProvider>
          <HocuspocusContextProvider name={DocId.root}>
            <ClientBoundary>
              <AppSidebar>
                <Outlet />
              </AppSidebar>
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
