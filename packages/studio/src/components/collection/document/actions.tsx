"use client";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ReactElement } from "react";
import { documentCollection, type DocumentItem } from "@/lib/data/store";
import { usePathname, useRouter } from "next/navigation";
import { isActive } from "@/lib/utils/urls";

export function DocumentActionsDropdown({ document }: { document: DocumentItem }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <Button variant="ghost" size="icon" className="text-muted-foreground ms-auto" asChild>
        <DropdownMenuTrigger aria-label="More Actions">
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
      </Button>
      <DropdownMenuContent>
        {document.permissions.delete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              documentCollection.delete(`${document.collectionId}-${document.id}`);
              if (isActive(pathname, `/collection/${document.collectionId}/${document.id}`, true)) {
                router.push(`/collection/${document.collectionId}`);
              }
            }}
          >
            <TrashIcon />
            Delete Item
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DocumentActionsContext({
  document,
  children,
}: {
  document: DocumentItem;
  children: ReactElement;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        {document.permissions.delete && (
          <ContextMenuItem
            variant="destructive"
            onClick={() => {
              documentCollection.delete(`${document.collectionId}-${document.id}`);
              if (isActive(pathname, `/collection/${document.collectionId}/${document.id}`, true)) {
                router.push(`/collection/${document.collectionId}`);
              }
            }}
          >
            <TrashIcon />
            Delete Item
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
