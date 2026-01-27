"use server";

import { studioHook } from "@/lib/content/index";
import { getCore, requireDocument } from "../config";
import type { CollectionItem, DocumentItem } from "./store";

export async function getCollectionItems(): Promise<CollectionItem[]> {
  const core = await getCore();
  return core.getCollections(true).map<CollectionItem>((collection) => ({
    id: collection.name,
    name: collection.name,
    badge: collection.constructor.name,
    supportStudio: collection.pluginHook(studioHook).disabled !== false,
  }));
}

export async function getDocumentItems(): Promise<DocumentItem[]> {
  const core = await getCore();
  const items = await Promise.all(
    core.getCollections(true).map(async (collection) => {
      const hook = collection.pluginHook(studioHook);
      const docs = await hook.getDocuments();
      const supportDelete = hook.actions?.deleteDocument !== undefined;

      return docs.map<DocumentItem>((doc) => ({
        name: doc.name,
        id: doc.id,
        collectionId: collection.name,
        permissions: {
          delete: supportDelete,
        },
      }));
    }),
  );

  return items.flat();
}

export async function deleteDocumentAction(documentId: string, collectionId: string) {
  const { collection, document } = await requireDocument(collectionId, documentId);
  const { deleteDocument } = collection.pluginHook(studioHook).actions ?? {};
  if (deleteDocument) {
    await deleteDocument({ collection, document });
  } else {
    throw new Error(`collection ${collectionId} does not support the delete operation.`);
  }
}
