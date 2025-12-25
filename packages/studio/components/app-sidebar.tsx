"use client";

import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { LayersIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";

export interface CollectionSidebarItem {
  name: string;
  type: string;
}

export function AppSidebar({
  items,
  ...props
}: React.ComponentProps<typeof Sidebar> & { items: CollectionSidebarItem[] }) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="font-medium font-mono">
                Fuma Content
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <Input placeholder="Search..." />
            </SidebarMenu>
            <SidebarMenu>
              {items.map((item) => {
                const href = `/collection/${item.name}`;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      tooltip={item.name}
                      asChild
                      isActive={pathname === href || pathname.startsWith(href + "/")}
                    >
                      <Link href={href}>
                        <LayersIcon className="text-muted-foreground" />
                        <p className="font-medium">{item.name}</p>
                        <Badge className="ms-auto">{item.type}</Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
