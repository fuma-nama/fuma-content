import { AppSidebar, CollectionSidebarItem } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCore } from "@/lib/config";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();
  const items = await Promise.all(
    core.getCollections(true).map(async (item) => {
      const handler = item.handlers.studio;
      const sidebarItems: CollectionSidebarItem[] = [
        {
          kind: "collection",
          name: item.name,
          href: `/collection/${item.name}`,
          type: item.typeInfo.id,
          depth: 1,
        },
      ];

      if (handler) {
        const docs = await handler.getDocuments();
        for (const doc of docs) {
          sidebarItems.push({
            kind: "document",
            name: doc.name,
            href: `/collection/${item.name}/${doc.id}`,
            depth: 2,
          });
        }
      }

      return sidebarItems;
    }),
  );

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" items={items.flat()} />
      <SidebarInset>
        {children}
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
