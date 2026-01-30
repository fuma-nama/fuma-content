import { defineCollectionHook, type Collection } from "fuma-content/collections";
import type { FC } from "react";
import type { DocumentItem } from "@/lib/data/store";
import { MDXCollection } from "fuma-content/collections/mdx";
import { mdxHook } from "./mdx";
import { DataCollection } from "fuma-content/collections/data";
import { dataHook } from "./data";

export type Awaitable<T> = T | Promise<T>;

export interface StudioDocument {
  /**
   * Unique ID of document.
   *
   * It can be used as path parameter, must not contain characters like '/'.
   */
  id: string;
  name: string;
}

export interface CreateDocumentDialogContext {
  collectionId: string;
  useDialog: () => {
    open: boolean;
    setOpen: (v: boolean) => void;
    onCreate: (item: DocumentItem) => void;
  };
}

export interface StudioHook<Doc extends StudioDocument = StudioDocument> {
  disabled?: boolean;
  init?: () => Awaitable<void>;
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

export interface ClientContext {
  dialogs?: {
    createDocument?: FC<CreateDocumentDialogContext>;
  };
}

export const studioHook = defineCollectionHook<StudioHook, StudioHook | undefined>(
  (collection, options) => {
    if (options) return options;
    if (collection instanceof MDXCollection) return mdxHook(collection) as unknown as StudioHook;
    if (collection instanceof DataCollection) return dataHook(collection) as unknown as StudioHook;

    return {
      disabled: true,
      getDocuments() {
        return [];
      },
      getDocument() {
        return undefined;
      },
    };
  },
);
