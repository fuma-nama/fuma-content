"use client";
import type { CollectionItem } from "@/lib/yjs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import type { ReactElement } from "react";
import {
  CreateDocumentDialog,
  CreateDocumentDialogTrigger,
  useCreateDocumentDialogCheck,
} from "./client";
import { PlusIcon } from "lucide-react";

export function CollectionActionsContext({
  collection,
  children,
}: {
  collection: CollectionItem;
  children: ReactElement;
}) {
  const canCreateDoc = useCreateDocumentDialogCheck(collection);

  let child = (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        {canCreateDoc && (
          <CreateDocumentDialogTrigger asChild>
            <ContextMenuItem>
              <PlusIcon />
              Create Document
            </ContextMenuItem>
          </CreateDocumentDialogTrigger>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  if (canCreateDoc)
    child = <CreateDocumentDialog collection={collection}>{child}</CreateDocumentDialog>;
  return child;
}
