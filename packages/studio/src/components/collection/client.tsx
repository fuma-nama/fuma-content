"use client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { documentCollection, type DocumentItem } from "@/lib/data/store";
import { type ReactNode, createContext, use, useCallback, useMemo, useState } from "react";
import { useClientContext } from "./context";
import { useNavigate } from "react-router";

const CreateDialogContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (item: DocumentItem) => void;
} | null>(null);

export function useCreateDocumentDialog(collectionId: string) {
  const Content = useClientContext(collectionId).dialogs?.createDocument;
  if (!Content) return null;

  return {
    component: useCallback(
      ({ children }: { children: ReactNode }) => {
        const [open, setOpen] = useState(false);
        const navigate = useNavigate();

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
                      navigate(`/collection/${item.collectionId}/${item.id}`);
                      documentCollection.utils.writeInsert(item);
                    },
                  }),
                  [open],
                )}
              >
                <Content collectionId={collectionId} useDialog={useDialog} />
              </CreateDialogContext>
            </DialogContent>
          </Dialog>
        );
      },
      [Content],
    ),
    trigger: DialogTrigger,
  };
}

function useDialog() {
  return use(CreateDialogContext)!;
}
