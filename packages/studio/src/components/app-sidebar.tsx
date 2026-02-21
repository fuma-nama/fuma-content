"use client";

import * as React from "react";
import { DotIcon, FileIcon, LayersIcon, Monitor, Moon, SearchIcon, Sun, XIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Logo } from "./icons/logo";
import { DocumentActionsContext } from "./collection/document/actions";
import { eq, ilike, or, useLiveQuery } from "@tanstack/react-db";
import {
  collection,
  documentCollection,
  type CollectionItem,
  type DocumentItem,
} from "@/lib/data/store";
import { CollectionActionsContext } from "./collection/actions";
import { Link, useLocation } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { cva } from "class-variance-authority";
import { Sheet, SheetClose, SheetContent } from "./ui/sheet";
import { buttonVariants } from "./ui/button";
import { useHotkeys } from "platejs/react";

const SidebarContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean | undefined;
} | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<boolean | null>(null);
  const isMobile = useIsMobile();

  if (isMobile !== undefined && open === null) setOpen(!isMobile);

  useHotkeys(["mod+s"], (e) => {
    setOpen((prev) => !prev);
    e.preventDefault();
  });

  return (
    <SidebarContext
      value={React.useMemo(() => ({ open: open ?? false, isMobile, setOpen }), [open, isMobile])}
    >
      {children}
    </SidebarContext>
  );
}

export function useSidebar() {
  return React.use(SidebarContext)!;
}

export const sidebarItemVariants = cva(
  "flex items-center px-4 py-1.5 gap-2 text-sm font-mono transition-colors border-s-2 border-transparent [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      active: {
        true: "text-accent-foreground bg-accent border-brand",
        false: "text-muted-foreground hover:text-accent-foreground",
      },
    },
  },
);

export function AppSidebar(props: React.ComponentProps<"aside">) {
  const sidebar = useSidebar();
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

  const content = (
    <>
      <div className="flex p-4 pb-2">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm font-mono">
          <Logo className="size-6" />
          Fuma Content
        </Link>
        {sidebar.isMobile && (
          <SheetClose
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                className: "ms-auto text-muted-foreground md:hidden",
              }),
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetClose>
        )}
      </div>
      <div className="inline-flex mx-4 items-center border rounded-md bg-secondary text-secondary-foreground transition-colors focus-within:ring-2 focus-within:ring-ring">
        <SearchIcon className="size-4 ms-2 text-muted-foreground" />
        <input
          placeholder="Search..."
          className="text-sm flex-1 px-2 py-1.5 focus-visible:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul>
        {items.map((item, i) => {
          const subsequence = i > 0 && items[i - 1].collection.id === item.collection.id;

          return (
            <React.Fragment key={`${item.collection.id}-${item.docs?.id}`}>
              {!subsequence && <SidebarCollectionItem item={item.collection} />}
              {item.docs && <SidebarDocumentItem item={item.docs} />}
            </React.Fragment>
          );
        })}
      </ul>

      <div className="mt-auto flex items-center gap-2 px-2.5 h-10 border-t">
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <Sheet open={sidebar.open} onOpenChange={sidebar.setOpen}>
      {sidebar.isMobile ? (
        <SheetContent
          side="left"
          {...(props as object)}
          className={cn("flex flex-col gap-2", props.className)}
        >
          {content}
        </SheetContent>
      ) : (
        <aside
          {...props}
          className={cn(
            "fixed flex flex-col gap-2 w-[300px] start-0 inset-y-0 transition-transform border-e max-md:hidden",
            !sidebar.open && "-translate-x-full",
            props.className,
          )}
        >
          {content}
        </aside>
      )}
      <div
        className={cn(
          "flex flex-col transition-[padding] min-h-screen",
          sidebar.open && "md:ps-[300px]",
        )}
      >
        {props.children}
      </div>
    </Sheet>
  );
}

function SidebarDocumentItem({ item }: { item: DocumentItem }) {
  const pathname = useLocation().pathname;
  const href = `/collection/${item.collectionId}/${item.id}`;
  const active = pathname === href;

  return (
    <DocumentActionsContext document={item}>
      <li>
        <Link to={href} className={cn(sidebarItemVariants({ active }), "ps-6")}>
          <FileIcon />
          {item.name}
        </Link>
      </li>
    </DocumentActionsContext>
  );
}

function SidebarCollectionItem({ item }: { item: CollectionItem }) {
  const pathname = useLocation().pathname;
  const href = `/collection/${item.id}`;
  const active = pathname === href;
  const opened = pathname.startsWith(href + "/");

  return (
    <CollectionActionsContext collection={item}>
      <li>
        <Link to={href} className={cn(sidebarItemVariants({ active }))}>
          <LayersIcon />
          {item.name}
          {item.badge && (
            <Badge variant={active || opened ? "default" : "outline"} className="ms-auto font-mono">
              {item.badge}
            </Badge>
          )}
        </Link>
      </li>
    </CollectionActionsContext>
  );
}

function ThemeToggle() {
  const { theme = "light", setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger
        className="px-1.5 text-xs h-6 rounded-lg text-muted-foreground"
        variant="ghost"
      >
        <div className="flex items-center gap-1.5">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="text-muted-foreground">
        <SelectItem value="light">
          <div className="flex items-center gap-1.5">
            <Sun className="size-4" />
            Light
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-1.5">
            <Moon className="size-4" fill="currentColor" />
            Dark
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-1.5">
            <Monitor className="size-4" />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
