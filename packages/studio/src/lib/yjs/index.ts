import { z } from "zod/mini";

export function getHocuspocusUrl() {
  if (import.meta.env.DEV) return "ws://localhost:8080/hocuspocus";

  if (typeof window === "undefined") return "";
  const url = new URL("/hocuspocus", window.location.href);
  url.protocol = url.protocol === "https" ? "wss" : "ws";
  return url.href;
}

const encodedSchema = z.tuple([z.string(), z.string()]);

export const DocId = {
  root: "root",
  encodeCollectionDoc(collectionId: string, documentId: string) {
    return JSON.stringify([collectionId, documentId]);
  },
  decodeCollectionDoc(id: string) {
    try {
      const parsed = JSON.parse(id);
      const result = encodedSchema.safeParse(parsed);

      return result.success ? result.data : null;
    } catch {
      return null;
    }
  },
};

export const collectionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  badge: z.optional(z.string()),

  supportStudio: z.boolean(),
  /** Data Collection only  */
  _data: z.optional(
    z.object({
      formats: z.array(z.string()),
    }),
  ),
});

export const documentItemSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  name: z.string(),

  permissions: z.object({
    delete: z.boolean(),
  }),
});

export const rootDataSchema = z.object({
  collections: z.array(collectionItemSchema),
  documents: z.array(documentItemSchema),
});

const cursorDataSchema = z.object({
  name: z.string(),
  color: z.string(),
});

export const awarenessSchema = z.looseObject({
  data: z.optional(cursorDataSchema),
  "json-schema-editor": z.optional(
    z.object({
      focused: z.nullable(z.optional(z.string())),
    }),
  ),
});

export type AwarenessState = z.infer<typeof awarenessSchema>;
export type CursorData = z.infer<typeof cursorDataSchema>;
export type DocumentItem = z.infer<typeof documentItemSchema>;
export type CollectionItem = z.infer<typeof collectionItemSchema>;

export function validateCollections(collections: unknown[]) {
  const out: CollectionItem[] = [];
  for (const item of collections) {
    const result = collectionItemSchema.safeParse(item);
    if (result.success) out.push(result.data);
  }
  return out;
}

export function validateDocuments(documents: unknown[]) {
  const out: DocumentItem[] = [];
  for (const item of documents) {
    const result = documentItemSchema.safeParse(item);
    if (result.success) out.push(result.data);
  }
  return out;
}
