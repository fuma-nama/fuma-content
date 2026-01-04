import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./query";
import { deleteDocumentAction, getCollectionItems, getDocumentItems } from "./actions";

export interface CollectionItem {
  id: string;
  name: string;
  badge?: string;
}

export interface DocumentItem {
  id: string;
  collectionId: string;
  name: string;

  permissions: {
    delete: boolean;
  };
}

export const collection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ["collections"],
    queryFn: () => getCollectionItems(),
    getKey: (item) => item.id,
  }),
);

export const documentCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ["documents"],
    queryFn: () => getDocumentItems(),
    getKey: (item) => `${item.collectionId}-${item.id}`,
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const original = mutation.original;
      // ignore if not supported
      if (!original.permissions.delete) return;

      try {
        await deleteDocumentAction(original.id, original.collectionId);
      } catch (error) {
        console.error("Delete failed, rolling back:", error);
        throw error;
      }
    },
  }),
);
