"use server";

import { studioHook } from "@/lib/content/index";
import { getCore, requireDocument } from "../config";
import type { CollectionItem, DocumentItem } from "./store";

export async function getCollectionItems(): Promise<CollectionItem[]> {
  const core = await getCore();
  return core
    .getCollections(true)
    .map<CollectionItem>((collection) => collection.pluginHook(studioHook).toItem());
}

export async function getDocumentItems(): Promise<DocumentItem[]> {
  const core = await getCore();
  const items = await Promise.all(
    core.getCollections(true).map(async (collection) => {
      const hook = collection.pluginHook(studioHook);
      const docs = await hook.getDocuments();

      return docs.map<DocumentItem>((doc) => doc.toItem({ collectionId: collection.name }));
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
