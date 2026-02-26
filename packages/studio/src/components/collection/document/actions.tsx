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
import type { DocumentItem } from "@/lib/yjs";
import { deleteDocument } from "@/lib/yjs/store";
import { useHocuspocusProvider } from "@/lib/yjs/provider";

export function DocumentActionsDropdown({ document }: { document: DocumentItem }) {
  const provider = useHocuspocusProvider();

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
              deleteDocument(provider.document, document.collectionId, document.id);
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
  const provider = useHocuspocusProvider();

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        {document.permissions.delete && (
          <ContextMenuItem
            variant="destructive"
            onClick={() => {
              deleteDocument(provider.document, document.collectionId, document.id);
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
