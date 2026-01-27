"use server";
import fs from "node:fs/promises";
import { getCore, requireDocument } from "@/lib/config";
import path from "node:path";
import type { DocumentItem } from "@/lib/data/store";
import { studioHook, type MDXStudioDocument, type StudioDocument } from "..";
import { MDXCollection } from "fuma-content/collections/mdx";
import grayMatter from "gray-matter";
import { removeUndefined } from "@/lib/utils/remove-undefined";

// TODO: check security when implementing auth system
export async function saveMDXDocument(
  collectionId: string,
  documentId: string,
  frontmatter: Record<string, unknown> | undefined,
  content: string,
) {
  const { document: doc } = await requireDocument<MDXStudioDocument | StudioDocument>(
    collectionId,
    documentId,
  );

  if ("type" in doc && doc.type === "mdx") {
    await fs.writeFile(
      doc.filePath,
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
  const filePath = path.join(collection.dir, `${name}.mdx`);
  const relativeFilePath = path.relative(collection.dir, filePath);

  if (relativeFilePath.startsWith(`..${path.sep}`)) {
    throw new Error(`invalid collection name: ${name}`);
  }

  const exists = await fs
    .access(filePath, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    throw new Error(`document ${name} already exists`);
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  return {
    collectionId,
    id: relativeFilePath,
    name: relativeFilePath,
    permissions: {
      delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
    },
  };
}
