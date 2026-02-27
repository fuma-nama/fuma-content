"use client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CollectionItem, DocumentItem } from "@/lib/yjs";
import { type ReactNode, createContext, use, useMemo, useState } from "react";
import { useClientContext } from "./context";
import { useNavigate } from "react-router";
import { useHocuspocusProvider } from "@/lib/yjs/provider";
import { insertDocument } from "@/lib/yjs/store";

const CreateDialogContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (item: DocumentItem) => void;
} | null>(null);

export function CreateDocumentDialog({
  collection,
  children,
}: {
  collection: CollectionItem | undefined;
  children: ReactNode;
}) {
  const Content = useClientContext(collection?.id).dialogs?.createDocument;
  const provider = useHocuspocusProvider();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      {Content && collection && (
        <DialogContent>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>Enter the basic information of document.</DialogDescription>
          <CreateDialogContext
            value={useMemo(
              () => ({
                open,
                setOpen,
                onCreate(item) {
                  insertDocument(provider.document, item);
                  navigate(`/collection/${item.collectionId}/${item.id}`);
                },
              }),
              [open, provider.document],
            )}
          >
            <Content collection={collection} useDialog={useDialog} />
          </CreateDialogContext>
        </DialogContent>
      )}
    </Dialog>
  );
}

export const CreateDocumentDialogTrigger = DialogTrigger;

export function useCreateDocumentDialogCheck(collection?: CollectionItem) {
  const Content = useClientContext(collection?.id).dialogs?.createDocument;
  return Content !== undefined && collection !== undefined;
}

function useDialog() {
  return use(CreateDialogContext)!;
}
