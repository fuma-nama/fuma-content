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
import { DocumentActionsContext } from "./collection/document/actions";
import { eq, useLiveQuery, ilike, or } from "@tanstack/react-db";
import {
  collection,
  documentCollection,
  type CollectionItem,
  type DocumentItem,
} from "@/lib/query/collections";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [search, setSearch] = React.useState("");
  const { data: items = [] } = useLiveQuery(
    (q) => {
      return q
        .from({ collection })
        .join({ docs: documentCollection }, ({ collection, docs }) =>
          eq(collection.id, docs.collectionId),
        )
        .where((b) =>
          or(ilike(b.collection.name, `${search}%`), ilike(b.docs?.name, `${search}%`)),
        );
    },
    [search],
  );
  console.log(items);
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
              {items.map((item, i) => {
                const subsequence = items.some(
                  (other, j) => j < i && other.collection.id === item.collection.id,
                );

                return (
                  <React.Fragment key={`${item.collection.id}-${item.docs?.id}`}>
                    {!subsequence && <SidebarCollectionItem item={item.collection} />}
                    {item.docs && <SidebarDocumentItem item={item.docs} />}
                  </React.Fragment>
                );
              })}
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

function SidebarDocumentItem({ item }: { item: DocumentItem }) {
  const pathname = usePathname();
  const href = `/collection/${item.collectionId}/${item.id}`;
  return (
    <DocumentActionsContext document={item}>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.name}
          isActive={pathname === href}
          className={cn("ps-5", !pathname.startsWith(href + "/") && "text-muted-foreground")}
          asChild
        >
          <Link href={href}>
            <FileIcon className="text-muted-foreground" />
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </DocumentActionsContext>
  );
}

function SidebarCollectionItem({ item }: { item: CollectionItem }) {
  const pathname = usePathname();
  const href = `/collection/${item.id}`;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.name}
        isActive={pathname === href}
        className={cn("ps-3", !pathname.startsWith(href + "/") && "text-muted-foreground")}
        asChild
      >
        <Link href={href}>
          <LayersIcon className="text-muted-foreground" />
          <span>{item.name}</span>
          {item.badge && <Badge className="ms-auto">{item.badge}</Badge>}
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
