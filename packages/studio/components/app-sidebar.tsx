"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { FileIcon, LayersIcon, Monitor, Moon, SearchIcon, Sun } from "lucide-react";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Logo } from "./icons/logo";

export interface CollectionSidebarItem {
  kind: "collection" | "document";
  name: string;
  href: string;
  depth: number;
  type?: string;
}

export function AppSidebar({
  items,
  ...props
}: React.ComponentProps<typeof Sidebar> & { items: CollectionSidebarItem[] }) {
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenuButton asChild>
          <Link href="/" className="ps-1 font-semibold text-lg font-mono">
            <Logo className="size-6!" />
            Fuma Content
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 border rounded-full bg-secondary text-secondary-foreground px-3 transition-colors focus-within:ring-2 focus-within:ring-ring">
              <SearchIcon className="size-4 text-muted-foreground" />
              <input
                placeholder="Search..."
                className="py-1.5 focus-visible:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <SidebarMenu className="gap-0">
              {items.map(
                (item, i) =>
                  item.name.toLowerCase().includes(deferredSearch.toLowerCase()) && (
                    <SidebarCollectionItem key={i} item={item} />
                  ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarCollectionItem({ item }: { item: CollectionSidebarItem }) {
  const pathname = usePathname();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.name}
        isActive={pathname === item.href}
        style={
          {
            "--depth": item.depth,
          } as object
        }
        className={cn(
          "ps-[calc(var(--depth)*var(--spacing)*3)]",
          !pathname.startsWith(item.href + "/") && "text-muted-foreground",
        )}
        asChild
      >
        <Link href={item.href}>
          {
            {
              document: <FileIcon className="text-muted-foreground" />,
              collection: <LayersIcon className="text-muted-foreground" />,
            }[item.kind]
          }
          <span>{item.name}</span>
          {item.type && <Badge className="ms-auto">{item.type}</Badge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ThemeToggle() {
  const { theme = "light", setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="text-muted-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light" className="gap-2">
          <Sun />
          Light
        </SelectItem>
        <SelectItem value="dark" className="gap-2">
          <Moon />
          Dark
        </SelectItem>
        <SelectItem value="system" className="gap-2">
          <Monitor />
          System
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
