"use server";
import { getCore, requireDocument } from "@/lib/config";
import type { DocumentItem } from "@/lib/data/store";
import { studioHook } from "..";
import { MDXCollection } from "fuma-content/collections/mdx";
import grayMatter from "gray-matter";
import { removeUndefined } from "@/lib/utils/remove-undefined";
import { isMDXDocument } from ".";
import { createFileDocument } from "../file";
import z from "zod";

const saveSchema = z.object({
  collectionId: z.string(),
  documentId: z.string(),
  frontmatter: z.record(z.string(), z.unknown()).optional(),
  content: z.string(),
});

// TODO: check security when implementing auth system
export async function saveMDXDocument(input: z.input<typeof saveSchema>) {
  const { collectionId, documentId, frontmatter, content } = saveSchema.parse(input);
  const { document: doc } = await requireDocument(collectionId, documentId);

  if (isMDXDocument(doc)) {
    await doc.write(
      frontmatter ? grayMatter.stringify(content, removeUndefined(frontmatter, true)) : content,
    );
  }
}

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
