"use server";
import { getCore, requireDocument } from "@/lib/config";
import type { DocumentItem } from "@/lib/data/store";
import { studioHook } from "..";
import { MDXCollection } from "fuma-content/collections/mdx";
import grayMatter from "gray-matter";
import { removeUndefined } from "@/lib/utils/remove-undefined";
import { isMDXDocument } from ".";
import { createFileDocument, encodeId } from "../file";

// TODO: check security when implementing auth system
export async function saveMDXDocument(
  collectionId: string,
  documentId: string,
  frontmatter: Record<string, unknown> | undefined,
  content: string,
) {
  const { document: doc } = await requireDocument(collectionId, documentId);

  if (isMDXDocument(doc)) {
    await doc.write(
      frontmatter ? grayMatter.stringify(content, removeUndefined(frontmatter, true)) : content,
    );
  }
}

export async function createMDXDocument(
  collectionId: string,
  name: string,
  content: string,
): Promise<DocumentItem> {
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!collection || !(collection instanceof MDXCollection))
    throw new Error("Invalid collection ID");

  const { relativePath } = await createFileDocument(collection, `${name}.mdx`, content);

  return {
    collectionId,
    id: encodeId(relativePath),
    name: relativePath,
    permissions: {
      delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
    },
  };
}
