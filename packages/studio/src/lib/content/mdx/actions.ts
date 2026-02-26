"use server";
// TODO: check security when implementing auth system
import { getCore } from "@/lib/config";
import type { DocumentItem } from "@/lib/yjs";
import { studioHook } from "..";
import { MDXCollection } from "fuma-content/collections/mdx";
import { createFileDocument } from "../file";
import { z } from "zod/mini";

const createSchema = z.object({
  collectionId: z.string(),
  name: z.string(),
  content: z.string(),
});

export async function createMDXDocument(
  input: z.input<typeof createSchema>,
): Promise<DocumentItem> {
  const { collectionId, content, name } = createSchema.parse(input);
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!collection || !(collection instanceof MDXCollection))
    throw new Error("Invalid collection ID");

  const { id, relativePath } = await createFileDocument(collection, `${name}.mdx`, content);

  return {
    collectionId,
    id,
    name: relativePath,
    permissions: {
      delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
    },
  };
}
