import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./query";
import { getCollectionItems, getDocumentItems } from "../actions";

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
  }),
);
