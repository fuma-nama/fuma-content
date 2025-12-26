"use server";
import { getCore } from "./config";

// TODO: check security when implementing auth system
export async function saveCollectionEntry(
  collection: string,
  entry: {
    id: string;
    value: unknown;
  },
) {
  const core = await getCore();
  const c = core.getCollection(collection);
  if (!c) throw new Error(`Missing Collection ${collection}`);
  const handler = c.handlers.studio;
  if (!handler) throw new Error(`Missing Studio Handler for ${collection}`);
  const doc = await handler.getDocument(entry.id);
  if (!doc) throw new Error(`Missing Document ${entry.id}`);

  await doc.setValue(entry.value);
}
