import type { StudioDocument } from "@/plugin/types";
import { type CollectionWithHandler, Core } from "fuma-content";
import { buildConfig } from "fuma-content/config";

let core: Promise<Core>;

export async function getCore(): Promise<Core> {
  core ??= (async () => {
    const core = new Core({
      outDir: ".content",
      configPath: "content.config.ts",
    });

    await core.init({
      config: buildConfig(await import("@/content.config")),
    });

    return core;
  })();

  return core;
}

export async function requireDocument<Doc extends StudioDocument = StudioDocument>(
  collectionId: string,
  documentId: string,
): Promise<{ collection: CollectionWithHandler<"studio">; document: Doc }> {
  const core = await getCore();
  const collection = core.getCollection(collectionId);
  if (!collection) throw new Error(`Missing Collection ${collectionId}`);
  const handler = collection.handlers.studio;
  if (!handler) throw new Error(`Missing Studio Handler for ${collectionId}`);
  const document: Doc | undefined = await handler.getDocument(documentId);
  if (!document) throw new Error(`Missing Document ${documentId}`);

  return { collection: collection as CollectionWithHandler<"studio">, document };
}
