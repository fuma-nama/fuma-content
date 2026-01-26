import { studioHook, type StudioDocument } from "lib";
import { Core } from "fuma-content";
import { Collection } from "fuma-content/collections";

let core: Promise<Core>;

export async function getCore(): Promise<Core> {
  core ??= (async () => {
    const core = new Core({
      outDir: ".content",
      configPath: process.env.STUDIO_CONFIG,
      cwd: process.env.STUDIO_PARENT_DIR,
    });

    await core.init({
      config: await import("virtual:content.config"),
    });

    return core;
  })();

  return core;
}

export async function requireCollection(collectionId: string): Promise<Collection> {
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!collection) throw new Error(`Missing Collection ${collectionId}`);

  return collection;
}

export async function requireDocument<Doc extends StudioDocument = StudioDocument>(
  collectionId: string,
  documentId: string,
): Promise<{ collection: Collection; document: Doc }> {
  const collection = await requireCollection(collectionId);
  const document = await collection.pluginHook(studioHook).getDocument(documentId);
  if (!document) throw new Error(`Missing Document ${documentId}`);

  return { collection, document: document as Doc };
}
