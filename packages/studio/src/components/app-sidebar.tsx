"use client";

import * as React from "react";
import { FileIcon, LayersIcon, Monitor, Moon, SearchIcon, Sun, XIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Logo } from "./icons/logo";
import { DocumentActionsContext } from "./collection/document/actions";
import type { CollectionItem, DocumentItem } from "@/lib/yjs";
import { CollectionActionsContext } from "./collection/actions";
import { Link, useLocation } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { cva } from "class-variance-authority";
import { Sheet, SheetClose, SheetContent } from "./ui/sheet";
import { buttonVariants } from "./ui/button";
import { useCollections, useDocuments } from "@/lib/yjs/store";

const SidebarContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean | undefined;
} | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<boolean | null>(null);
  const isMobile = useIsMobile();

  const onKeyDown = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      setOpen((prev) => !prev);
      e.preventDefault();
    }
  });

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (isMobile !== undefined && open === null) setOpen(!isMobile);

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
  "flex items-center px-4 py-1.5 gap-2 text-sm font-mono truncate transition-colors border-s-2 border-transparent [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      active: {
        true: "text-accent-foreground bg-accent border-brand",
        false: "text-muted-foreground hover:text-accent-foreground",
      },
    },
  },
);

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebar();
  const [search, setSearch] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const deferredSearch = React.useDeferredValue(search);

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
        <SearchIcon className="size-4 ms-2 text-muted-foreground shrink-0" />
        <input
          placeholder="Search..."
          className="text-sm flex-1 px-2 py-1.5 focus-visible:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul>
        <React.Suspense>
          <SidebarItems search={deferredSearch} />
        </React.Suspense>
      </ul>

      <div className="mt-auto flex items-center gap-2 px-2.5 h-10 border-t">
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <Sheet open={sidebar.open} onOpenChange={sidebar.setOpen}>
      <style>{`:root { --sidebar-width: 300px; }`}</style>
      {sidebar.isMobile ? (
        <SheetContent side="left" className="flex flex-col gap-2">
          {content}
        </SheetContent>
      ) : (
        <DraggableAside dragging={dragging} setDragging={setDragging}>
          {content}
        </DraggableAside>
      )}
      <div
        className={cn(
          "flex flex-col min-h-screen",
          dragging ? "pointer-events-none" : "transition-[padding]",
          sidebar.open && "md:ps-(--sidebar-width)",
        )}
      >
        {children}
      </div>
    </Sheet>
  );
}

function SidebarItems({ search }: { search: string }) {
  const collections = useCollections();
  const documents = useDocuments();

  const items = React.useMemo(() => {
    const out: { collection: CollectionItem; docs: DocumentItem[] }[] = [];
    const normalizedSearch = search.toLowerCase().trim();

    for (const col of collections) {
      const docs = documents.filter(
        (doc) =>
          doc.collectionId === col.id &&
          (normalizedSearch.length === 0 || doc.name.toLowerCase().includes(normalizedSearch)),
      );

      if (
        normalizedSearch.length > 0 &&
        !col.name.toLowerCase().includes(normalizedSearch) &&
        docs.length === 0
      )
        continue;

      out.push({
        collection: col,
        docs,
      });
    }
    return out;
  }, [collections, documents, search]);

  return items.map((item) => {
    return (
      <React.Fragment key={item.collection.id}>
        <SidebarCollectionItem item={item.collection} />
        {item.docs.map((doc) => (
          <SidebarDocumentItem key={doc.id} item={doc} />
        ))}
      </React.Fragment>
    );
  });
}

function DraggableAside({
  dragging,
  setDragging,
  ...props
}: { dragging: boolean; setDragging: (v: boolean) => void } & React.ComponentProps<"aside">) {
  const sidebar = useSidebar();

  const onMouseMove = React.useEffectEvent((e: MouseEvent) => {
    if (!dragging) return;
    document.body.style.setProperty(
      "--sidebar-width",
      `${Math.max(Math.min(e.clientX, 500), 200)}px`,
    );

    e.stopPropagation();
    e.preventDefault();
  });
  const onDragStart = () => {
    setDragging(true);
    document.addEventListener("mousemove", onMouseMove, { capture: true });
    document.addEventListener("mouseleave", onDragEnd);
    document.addEventListener("mouseup", onDragEnd);
  };
  const onDragEnd = React.useEffectEvent(() => {
    setDragging(false);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseleave", onDragEnd);
    document.removeEventListener("mouseup", onDragEnd);
  });

  return (
    <aside
      {...props}
      className={cn(
        "fixed flex flex-col gap-2 w-(--sidebar-width) start-0 inset-y-0 transition-transform border-e z-40 max-md:hidden",
        !sidebar.open && "-translate-x-full pointer-events-none",
        props.className,
      )}
    >
      {props.children}
      <button
        aria-label="Drag to resize sidebar"
        className={cn(
          "absolute end-0 translate-x-1/2 w-1.5 inset-y-0 bg-primary/50 opacity-0",
          dragging ? "opacity-100" : "hover:opacity-100",
        )}
        onMouseDown={onDragStart}
      />
    </aside>
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
