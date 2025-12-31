"use client";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDocumentAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ReactElement } from "react";

export function DocumentActionsDropdown({
  collectionId,
  documentId,
  allowDelete = false,
}: {
  collectionId: string;
  documentId: string;
  allowDelete?: boolean;
}) {
  return (
    <DropdownMenu>
      <Button variant="ghost" size="icon" className="text-muted-foreground ms-auto" asChild>
        <DropdownMenuTrigger aria-label="More Actions">
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
      </Button>
      <DropdownMenuContent>
        {allowDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void deleteDocumentAction(documentId, collectionId);
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
  collectionId,
  documentId,
  allowDelete = false,
  children,
}: {
  collectionId: string;
  documentId: string;
  allowDelete?: boolean;
  children: ReactElement;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        {allowDelete && (
          <ContextMenuItem
            variant="destructive"
            onClick={() => {
              void deleteDocumentAction(documentId, collectionId);
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
