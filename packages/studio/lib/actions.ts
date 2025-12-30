"use server";

import { requireDocument } from "./config";

export async function deleteDocumentAction(documentId: string, collectionId: string) {
  const { collection, document } = await requireDocument(collectionId, documentId);
  const { deleteDocument } = collection.handlers.studio!.actions ?? {};
  if (deleteDocument) {
    await deleteDocument({ collection, document });
  } else {
    throw new Error(`collection ${collectionId} does not support the delete operation.`);
  }
}
