"use server";

import { getCore, requireDocument } from "../config";
import type { CollectionItem, DocumentItem } from "./store";

export async function getCollectionItems(): Promise<CollectionItem[]> {
  const core = await getCore();
  return core.getCollections(true).map<CollectionItem>((collection) => ({
    id: collection.name,
    name: collection.name,
    badge: collection.typeInfo.id,
  }));
}

export async function getDocumentItems(): Promise<DocumentItem[]> {
  const core = await getCore();
  const items = await Promise.all(
    core.getCollections(true).map(async (collection) => {
      const handler = collection.handlers.studio;

      if (handler) {
        const docs = await handler.getDocuments();
        const supportDelete = handler.actions?.deleteDocument !== undefined;

        return docs.map<DocumentItem>((doc) => ({
          name: doc.name,
          id: doc.id,
          collectionId: collection.name,
          permissions: {
            delete: supportDelete,
          },
        }));
      }

      return [];
    }),
  );

  return items.flat();
}

export async function deleteDocumentAction(documentId: string, collectionId: string) {
  const { collection, document } = await requireDocument(collectionId, documentId);
  const { deleteDocument } = collection.handlers.studio.actions ?? {};
  if (deleteDocument) {
    await deleteDocument({ collection, document });
  } else {
    throw new Error(`collection ${collectionId} does not support the delete operation.`);
  }
}
