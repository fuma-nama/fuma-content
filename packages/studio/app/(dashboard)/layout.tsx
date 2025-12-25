import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCore } from "@/lib/config";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        items={core.getCollections(true).map((item) => {
          return {
            name: item.name,
            type: item.typeInfo.id,
          };
        })}
      />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
