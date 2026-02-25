import { z } from "zod/mini";

export function getHocuspocusUrl() {
  if (import.meta.env.DEV) return "ws://localhost:8080/hocuspocus";

  if (typeof window === "undefined") return "";
  const url = new URL("/hocuspocus", window.location.href);
  url.protocol = url.protocol === "https" ? "wss" : "ws";
  return url.href;
}

export function encodeDocId(collectionId: string, documentId: string) {
  return JSON.stringify([collectionId, documentId]);
}

const encodedSchema = z.tuple([z.string(), z.string()]);

export function decodeDocId(id: string): [collectionId: string, documentId: string] | null {
  try {
    const parsed = JSON.parse(id);
    const result = encodedSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export const awarenessSchema = z.looseObject({
  data: z.optional(
    z.object({
      name: z.string(),
      color: z.string(),
    }),
  ),
  "json-schema-editor": z.optional(
    z.object({
      focused: z.nullable(z.optional(z.string())),
    }),
  ),
});

export type AwarenessState = z.infer<typeof awarenessSchema>;
