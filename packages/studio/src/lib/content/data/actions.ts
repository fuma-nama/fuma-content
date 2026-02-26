"use server";
import { getCore, requireDocument } from "@/lib/config";
import type { DocumentItem } from "@/lib/yjs";
import { studioHook } from "..";
import { createFileDocument } from "../file";
import { DataStudioDocument, encoderDecoders, getEncoderDecoder } from ".";
import { DataCollection } from "fuma-content/collections/data";
import { z } from "zod/mini";

const saveSchema = z.object({
  collectionId: z.string(),
  documentId: z.string(),
  data: z.unknown(),
});

// TODO: check security when implementing auth system
export async function saveDataDocument(input: z.input<typeof saveSchema>) {
  const { collectionId, data, documentId } = saveSchema.parse(input);
  const { document: doc } = await requireDocument(collectionId, documentId);
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!(collection instanceof DataCollection)) throw new Error("Invalid collection ID");

  if (doc instanceof DataStudioDocument) {
    await doc.write(await doc.encoderDecoder.encode(data));
  }
}

const createSchema = z.object({
  collectionId: z.string(),
  name: z.string(),
  type: z.literal(Object.keys(encoderDecoders) as (keyof typeof encoderDecoders)[]),
  data: z.unknown(),
});
export async function createDataDocument(
  input: z.input<typeof createSchema>,
): Promise<DocumentItem> {
  const { collectionId, name, type, data } = createSchema.parse(input);
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!(collection instanceof DataCollection)) throw new Error("Invalid collection ID");

  const { id, relativePath } = await createFileDocument(
    collection,
    `${name}.${type}`,
    await getEncoderDecoder(type).encode(data),
  );

  return {
    collectionId,
    id,
    name: relativePath,
    permissions: {
      delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
    },
  };
}
