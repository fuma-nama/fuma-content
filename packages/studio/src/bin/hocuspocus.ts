import { Server } from "@hocuspocus/server";
import type { Application } from "express-ws";
import type { Awaitable, studioHook } from "@/lib/content";
import { DocId } from "@/lib/yjs";
import type { Core } from "fuma-content";
import * as Y from "yjs";
import { applyJsonArray } from "mutative-yjs";
import type { RootHandler } from "@/lib/content/root";

export interface HocuspocusEnv {
  getCore: () => Awaitable<Core>;
  getRootHandler: () => Awaitable<RootHandler>;
  getPluginHook: () => typeof studioHook;
}

export function createHocuspocus(app: Application) {
  const server = new Server({
    name: "hocuspocus",
    quiet: true,
    async onLoadDocument(data) {
      const env = global.HOCUSPOCUS_ENV;
      if (!env) {
        console.error("[hocuspocus] missing env");
        return;
      }

      if (DocId.root === data.documentName) {
        const { getCollectionItems, getDocumentItems } = await env.getRootHandler();

        const doc = new Y.Doc();
        const collections = doc.getArray("collections");
        const documents = doc.getArray("documents");
        applyJsonArray(collections, (await getCollectionItems()) as never[]);
        applyJsonArray(documents, (await getDocumentItems()) as never[]);

        return doc;
      }

      const core = await env.getCore();
      const docId = DocId.decodeCollectionDoc(data.documentName);
      if (!docId) return;

      const [collectionId, documentId] = docId;
      const collection = core.getCollection(collectionId);
      if (!collection) return;

      return await collection.pluginHook(env.getPluginHook()).hocuspocus?.loadDocument?.(data, {
        collectionId,
        documentId,
      });
    },
    async onStoreDocument(data) {
      const env = global.HOCUSPOCUS_ENV;
      if (!env) {
        console.error("[hocuspocus] missing env");
        return;
      }

      if (DocId.root === data.documentName) {
        return;
      }

      const core = await env.getCore();
      const docId = DocId.decodeCollectionDoc(data.documentName);
      if (!docId) return;

      const [collectionId, documentId] = docId;
      const collection = core.getCollection(collectionId);
      if (!collection) return;

      await collection.pluginHook(env.getPluginHook()).hocuspocus?.storeDocument?.(data, {
        collectionId,
        documentId,
      });
    },
  });
  app.ws("/hocuspocus", (websocket, request) => {
    server.hocuspocus.handleConnection(websocket, request);
  });
  return server;
}

declare global {
  export var HOCUSPOCUS_ENV: HocuspocusEnv | undefined;
}
