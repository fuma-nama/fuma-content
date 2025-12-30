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

export function CollectionDocumentActions({
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
