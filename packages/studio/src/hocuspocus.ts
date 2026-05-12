import { Server } from "@hocuspocus/server";
import { studioHook } from "@/lib/content";
import { DocId } from "@/lib/yjs";
import * as Y from "yjs";
import { applyJsonArray } from "mutative-yjs";
import { rootHandler } from "@/lib/content/root";
import { getCore } from "./lib/config";

export function createHocuspocus() {
  return new Server({
    name: "hocuspocus",
    quiet: true,
    async onLoadDocument(data) {
      if (DocId.root === data.documentName) {
        const { getCollectionItems, getDocumentItems } = rootHandler;

        const doc = new Y.Doc();
        const collections = doc.getArray("collections");
        const documents = doc.getArray("documents");
        applyJsonArray(collections, (await getCollectionItems()) as never[]);
        applyJsonArray(documents, (await getDocumentItems()) as never[]);

        return doc;
      }

      const core = await getCore();
      const docId = DocId.decodeCollectionDoc(data.documentName);
      if (!docId) return;

      const [collectionId, documentId] = docId;
      const collection = core.getCollection(collectionId);
      if (!collection) return;

      return await collection.pluginHook(studioHook).hocuspocus?.loadDocument?.(data, {
        collectionId,
        documentId,
      });
    },
    async onStoreDocument(data) {
      if (DocId.root === data.documentName) {
        return;
      }

      const core = await getCore();
      const docId = DocId.decodeCollectionDoc(data.documentName);
      if (!docId) return;

      const [collectionId, documentId] = docId;
      const collection = core.getCollection(collectionId);
      if (!collection) return;

      await collection.pluginHook(studioHook).hocuspocus?.storeDocument?.(data, {
        collectionId,
        documentId,
      });
    },
  });
}
