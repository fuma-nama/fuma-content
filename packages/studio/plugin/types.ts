import type { DocumentItem } from "@/lib/data/store";
import type { Collection } from "fuma-content/collections";
import type { FC } from "react";

type Awaitable<T> = T | Promise<T>;

export interface StudioDocument {
  id: string;
  name: string;
}

export interface MDXStudioDocument extends StudioDocument {
  type: "mdx";
  filePath: string;
}

export interface CreateDocumentDialogContext {
  collectionId: string;
  useDialog: () => {
    open: boolean;
    setOpen: (v: boolean) => void;
    onCreate: (item: DocumentItem) => void;
  };
}

export interface ClientContext {
  dialogs?: {
    createDocument?: FC<CreateDocumentDialogContext>;
  };
}

export interface StudioHandler<Doc extends StudioDocument> {
  getDocuments: () => Awaitable<Doc[]>;
  getDocument: (id: string) => Awaitable<Doc | undefined>;

  pages?: {
    edit?: FC<{ document: Doc; collection: Collection }>;
  };

  /**
   * the properties inside should be exported from a file with "use client".
   */
  client?: () => Awaitable<ClientContext>;

  actions?: {
    deleteDocument?: (options: { collection: Collection; document: Doc }) => Awaitable<void>;
  };
}
