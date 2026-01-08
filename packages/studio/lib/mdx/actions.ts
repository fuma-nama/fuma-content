"use server";
import fs from "node:fs/promises";
import { requireCollection, requireDocument } from "@/lib/config";
import type { MDXStudioDocument, StudioDocument } from "../types";
import path from "node:path";
import type { DocumentItem } from "@/lib/data/store";

// TODO: check security when implementing auth system
export async function saveMDXDocument(collectionId: string, documentId: string, value: string) {
  const { document: doc } = await requireDocument<MDXStudioDocument | StudioDocument>(
    collectionId,
    documentId,
  );

  if ("type" in doc && doc.type === "mdx") {
    await fs.writeFile(doc.filePath, value);
  }
}

export async function createMDXDocument(
  collectionId: string,
  name: string,
  content: string,
): Promise<DocumentItem> {
  const collection = await requireCollection(collectionId, ["studio", "mdx", "fs"]);
  const fsHandler = collection.handlers.fs;
  const filePath = path.join(fsHandler.dir, `${name}.mdx`);
  const relativeFilePath = path.relative(fsHandler.dir, filePath);

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
      delete: collection.handlers.studio.actions?.deleteDocument !== undefined,
    },
  };
}
