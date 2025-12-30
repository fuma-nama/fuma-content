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

export type CollectionSidebarItem =
  | {
      kind: "collection";
      id: string;
      name: string;
      badge?: string;
    }
  | {
      kind: "document";
      id: string;
      collectionId: string;
      name: string;
    };

export function AppSidebar({
  items,
  ...props
}: React.ComponentProps<typeof Sidebar> & { items: CollectionSidebarItem[] }) {
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => item.name.toLowerCase().includes(deferredSearch.toLowerCase()));
  }, [items, deferredSearch]);

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
              {filteredItems.map((item, i) => (
                <SidebarCollectionItem key={i} item={item} />
              ))}
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
  const href =
    item.kind === "collection"
      ? `/collection/${item.id}`
      : `/collection/${item.collectionId}/${item.id}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.name}
        isActive={pathname === href}
        className={cn(
          item.kind === "collection" && "ps-3",
          item.kind === "document" && "ps-5",
          !pathname.startsWith(href + "/") && "text-muted-foreground",
        )}
        asChild
      >
        <Link href={href}>
          {
            {
              document: <FileIcon className="text-muted-foreground" />,
              collection: <LayersIcon className="text-muted-foreground" />,
            }[item.kind]
          }
          <span>{item.name}</span>
          {item.kind === "collection" && item.badge && (
            <Badge className="ms-auto">{item.badge}</Badge>
          )}
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
