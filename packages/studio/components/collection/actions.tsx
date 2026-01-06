"use client";
import type { CollectionItem } from "@/lib/data/store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import type { ReactElement } from "react";
import { useCreateDocumentDialog } from "./client";
import { FilePlusIcon } from "lucide-react";

export function CollectionActionsContext({
  collection,
  children,
}: {
  collection: CollectionItem;
  children: ReactElement;
}) {
  const createDoc = useCreateDocumentDialog(collection.id);

  let child = (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent>
        {createDoc && (
          <createDoc.trigger asChild>
            <ContextMenuItem>
              <FilePlusIcon />
              Create Document
            </ContextMenuItem>
          </createDoc.trigger>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  if (createDoc) child = <createDoc.component>{child}</createDoc.component>;

  return child;
}
