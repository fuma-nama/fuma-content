import { AppSidebar } from "@/components/app-sidebar";
import { ClientContextProvider } from "@/components/collection/context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import { ClientContext, studioHook } from "@/lib/content";
import { Route } from "./+types/layout";
import { queryClient } from "@/lib/data/query";
import { getCollectionItems, getDocumentItems } from "@/lib/data/actions";
import { dehydrate, DehydratedState, HydrationBoundary } from "@tanstack/react-query";
import { Outlet } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import type { ReactNode } from "react";

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

  await queryClient.prefetchQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionItems(),
  });
  await queryClient.prefetchQuery({
    queryKey: ["documents"],
    queryFn: () => getDocumentItems(),
  });

  return {
    clientContexts,
    queryState: dehydrate(queryClient),
  };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <ClientContextProvider contexts={loaderData.clientContexts}>
      <ClientBoundary>
        <HydrationBoundary state={loaderData.queryState as DehydratedState}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Outlet />
              <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </HydrationBoundary>
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
