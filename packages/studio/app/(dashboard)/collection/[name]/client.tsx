"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { DocumentItem } from "@/lib/data/store";
import type { CreateClientContext } from "@/plugin";
import { FilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, createContext, use, useMemo, useState } from "react";

export const createDocumentContext: CreateClientContext = {
  useDialog() {
    return use(CreateDialogContext)!;
  },
};

const CreateDialogContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (item: DocumentItem) => void;
} | null>(null);

export function CreateDocumentDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePlusIcon />
          Create Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create Document</DialogTitle>
        <DialogDescription>Enter the basic information of document.</DialogDescription>
        <CreateDialogContext
          value={useMemo(
            () => ({
              open,
              setOpen,
              onCreate(item) {
                router.push(`/collection/${item.collectionId}/${item.id}`);
              },
            }),
            [open, router],
          )}
        >
          {children}
        </CreateDialogContext>
      </DialogContent>
    </Dialog>
  );
}
