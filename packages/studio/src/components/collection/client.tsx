"use client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CollectionItem, DocumentItem } from "@/lib/yjs";
import { type ReactNode, createContext, use, useCallback, useMemo, useState } from "react";
import { useClientContext } from "./context";
import { useNavigate } from "react-router";
import { useHocuspocusProvider } from "@/lib/yjs/provider";
import { insertDocument } from "@/lib/yjs/store";

const CreateDialogContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (item: DocumentItem) => void;
} | null>(null);

export function useCreateDocumentDialog(collection?: CollectionItem) {
  const Content = useClientContext(collection?.id).dialogs?.createDocument;
  if (!Content) return null;

  return {
    component: useCallback(
      ({ children }: { children: ReactNode }) => {
        const provider = useHocuspocusProvider();
        const [open, setOpen] = useState(false);
        const navigate = useNavigate();

        if (!collection) return;
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            {children}
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
          </Dialog>
        );
      },
      [Content, collection],
    ),
    trigger: DialogTrigger,
  };
}

function useDialog() {
  return use(CreateDialogContext)!;
}
