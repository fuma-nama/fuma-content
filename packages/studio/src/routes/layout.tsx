import { AppSidebar, SidebarProvider } from "@/components/app-sidebar";
import { ClientContextProvider } from "@/components/collection/context";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import { ClientContext, studioHook } from "@/lib/content";
import { Route } from "./+types/layout";
import { Outlet } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import type { ReactNode } from "react";
import { HocuspocusContextProvider, WebsocketProvider } from "@/lib/yjs/provider";
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
      <ClientBoundary>
        <WebsocketProvider>
          <HocuspocusContextProvider name={DocId.root}>
            <SidebarProvider>
              <AppSidebar>
                <Outlet />
              </AppSidebar>
              <Toaster />
            </SidebarProvider>
          </HocuspocusContextProvider>
        </WebsocketProvider>
      </ClientBoundary>
    </ClientContextProvider>
  );
}

function ClientBoundary({ children }: { children: ReactNode }) {
  const mounted = useMounted();

  if (!mounted)
    return (
      <div className="fixed flex items-center justify-center inset-0 bg-background z-50 text-sm text-muted-foreground gap-1">
        <Spinner />
        Loading
      </div>
    );

  return children;
}
