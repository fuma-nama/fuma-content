import { Server } from "@hocuspocus/server";
import type { Application } from "express-ws";
import type { Awaitable, studioHook } from "@/lib/content";
import { decodeDocId } from "@/lib/yjs";
import type { Core } from "fuma-content";

export interface HocuspocusEnv {
  getCore: () => Awaitable<Core>;
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

      const core = await env.getCore();
      const docId = decodeDocId(data.documentName);
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

      const core = await env.getCore();
      const docId = decodeDocId(data.documentName);
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
