import { AppSidebar, CollectionSidebarItem } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();
  const items = await Promise.all(
    core.getCollections(true).map(async (collection) => {
      const handler = collection.handlers.studio;
      const sidebarItems: CollectionSidebarItem[] = [
        {
          kind: "collection",
          id: collection.name,
          name: collection.name,
          badge: collection.typeInfo.id,
        },
      ];

      if (handler) {
        const docs = await handler.getDocuments();
        for (const doc of docs) {
          sidebarItems.push({
            kind: "document",
            name: doc.name,
            id: doc.id,
            collectionId: collection.name,
          });
        }
      }

      return sidebarItems;
    }),
  );

  return (
    <SidebarProvider>
      <AppSidebar items={items.flat()} />
      <SidebarInset>
        {children}
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
