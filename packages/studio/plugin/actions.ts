"use server";
import fs from "node:fs/promises";
import { requireDocument } from "@/lib/config";
import type { MDXStudioDocument, StudioDocument } from "./types";

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
