import { studioHook, type StudioDocument } from "@/lib/content";
import { Core } from "fuma-content";
import { Collection } from "fuma-content/collections";
import { createDynamicCore } from "fuma-content/dynamic";

const dynamic = createDynamicCore({
  core: new Core({
    outDir: process.env.STUDIO_DIST,
    configPath: process.env.STUDIO_CONFIG,
    cwd: process.env.STUDIO_PARENT_DIR,
  }),
  mode: "production",
  compileMode: true,
});

export async function getCore(): Promise<Core> {
  return dynamic.getCore();
}

export async function requireDocument<Doc extends StudioDocument = StudioDocument>(
  collectionId: string,
  documentId: string,
): Promise<{ collection: Collection; document: Doc }> {
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!collection) throw new Error(`Missing Collection ${collectionId}`);

  const document = await collection.pluginHook(studioHook).getDocument(documentId);
  if (!document) throw new Error(`Missing Document ${documentId}`);

  return { collection, document: document as Doc };
}

global.HOCUSPOCUS_ENV = {
  getCore,
  getPluginHook() {
    return studioHook;
  },
};
