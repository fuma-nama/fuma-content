import { Server } from "@hocuspocus/server";
import type { Application } from "express-ws";
import { Doc } from "yjs";

export function createHocuspocus(app: Application) {
  const server = new Server({
    name: "hocuspocus",
    quiet: true,
    async onLoadDocument() {
      return new Doc();
    },
  });
  app.ws("/hocuspocus", (websocket, request) => {
    server.hocuspocus.handleConnection(websocket, request);
  });
  return server;
}
