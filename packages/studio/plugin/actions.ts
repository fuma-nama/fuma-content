"use server";
import fs from "node:fs/promises";
import { getCore } from "@/lib/config";
import type { MDXStudioDocument, StudioDocument } from "./types";

// TODO: check security when implementing auth system
export async function saveMDXDocument(collectionId: string, documentId: string, value: string) {
  const core = await getCore();
  const c = core.getCollection(collectionId);
  if (!c) throw new Error(`Missing Collection ${collectionId}`);
  const handler = c.handlers.studio;
  if (!handler) throw new Error(`Missing Studio Handler for ${collectionId}`);
  const doc: MDXStudioDocument | StudioDocument | undefined = await handler.getDocument(documentId);
  if (!doc) throw new Error(`Missing Document ${documentId}`);

  if ("type" in doc && doc.type === "mdx") {
    await fs.writeFile(doc.filePath, value);
  }
}
