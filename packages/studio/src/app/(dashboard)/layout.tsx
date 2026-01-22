import { AppSidebar } from "@/components/app-sidebar";
import { ClientContextProvider } from "@/components/collection/context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import { DataBoundary } from "@/lib/data/boundary";
import { ClientContext, studioHook } from "lib";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();
  const collections = core.getCollections(true);
  const clientContexts = new Map<string, ClientContext>();
  for (const collection of collections) {
    const { client } = collection.pluginHook(studioHook);
    if (client) {
      clientContexts.set(collection.name, await client());
    }
  }

  return (
    <ClientContextProvider contexts={clientContexts}>
      <DataBoundary>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {children}
            <Toaster />
          </SidebarInset>
        </SidebarProvider>
      </DataBoundary>
    </ClientContextProvider>
  );
}
