"use server";
import { getCore, requireDocument } from "@/lib/config";
import type { DocumentItem } from "@/lib/data/store";
import { studioHook } from "..";
import { createFileDocument, encodeId } from "../file";
import { isDataDocument } from ".";
import { DataCollection } from "fuma-content/collections/data";

// TODO: check security when implementing auth system
export async function saveDataDocument(collectionId: string, documentId: string, data: unknown) {
  const { document: doc } = await requireDocument(collectionId, documentId);
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!(collection instanceof DataCollection)) throw new Error("Invalid collection ID");

  if (isDataDocument(doc)) {
    await doc.write(await doc.encode(data));
  }
}

export async function createDataDocument(
  collectionId: string,
  name: string,
  data: unknown,
): Promise<DocumentItem> {
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!(collection instanceof DataCollection)) throw new Error("Invalid collection ID");

  const { relativePath } = await createFileDocument(
    collection,
    `${name}.json`,
    JSON.stringify(data, null, 2),
  );

  return {
    collectionId,
    id: encodeId(relativePath),
    name: relativePath,
    permissions: {
      delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
    },
  };
}
