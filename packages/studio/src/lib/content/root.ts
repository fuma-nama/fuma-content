import { studioHook } from "@/lib/content/index";
import { getCore } from "../config";
import type { CollectionItem, DocumentItem } from "../yjs";

export type RootHandler = typeof rootHandler;

export const rootHandler = {
  async getCollectionItems(): Promise<CollectionItem[]> {
    const core = await getCore();
    return core
      .getCollections(true)
      .map<CollectionItem>((collection) => collection.pluginHook(studioHook).toItem());
  },
  async getDocumentItems(): Promise<DocumentItem[]> {
    const core = await getCore();
    const items = await Promise.all(
      core.getCollections(true).map(async (collection) => {
        const hook = collection.pluginHook(studioHook);
        const docs = await hook.getDocuments();

        return docs.map<DocumentItem>((doc) => doc.toItem({ collectionId: collection.name }));
      }),
    );

    return items.flat();
  },
};
