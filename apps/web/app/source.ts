import entry from "content";
import { document, json } from "fuma-content";
import { z } from "zod";

export const documents = document(entry, {
  include: ["content/*"],
  schema: z.object({ title: z.string(), description: z.string().optional() }),
});

export const jsons = json(entry, {
  schema: z.object({ title: z.string() }),
});
