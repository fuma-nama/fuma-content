import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getCore } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { LayersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset">
        {core.getCollections(true).map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton tooltip={item.name} asChild>
              <Link href={`/collection/${item.name}`}>
                <LayersIcon className="text-muted-foreground" />
                <p className="font-medium">{item.name}</p>
                <Badge className="ms-auto">{item.typeInfo.id}</Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </AppSidebar>
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
