import path from "node:path";
import { serve, upgradeWebSocket } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type MiddlewareHandler } from "hono";
import { unstable_createServerEntryAdapter as createServerEntryAdapter } from "waku/adapter-builders";
import {
  unstable_constants as constants,
  unstable_honoMiddleware as honoMiddleware,
} from "waku/internals";
import { createHocuspocus } from "./hocuspocus";
import { WebSocketServer } from "ws";

const { DIST_PUBLIC } = constants;
const { contextMiddleware, rscMiddleware, middlewareRunner } = honoMiddleware;

interface Options {
  middlewareFns?: (() => MiddlewareHandler)[];
  middlewareModules?: Record<
    string,
    () => Promise<{
      default: () => MiddlewareHandler;
    }>
  >;
}

export default createServerEntryAdapter<Options>(
  ({ processRequest, processBuild, config, isBuild, notFoundHtml }, options) => {
    const { middlewareFns = [], middlewareModules = {} } = options || {};
    const app = new Hono();
    app.notFound((c) => {
      if (notFoundHtml) {
        return c.html(notFoundHtml, 404);
      }
      return c.text("404 Not Found", 404);
    });
    if (isBuild) {
      app.use(
        `${config.basePath}*`,
        serveStatic({
          root: path.resolve(config.distDir, DIST_PUBLIC),
          rewriteRequestPath: (path) => path.slice(config.basePath.length - 1),
        }),
      );
    }

    const hocuspocus = createHocuspocus();
    app.get(
      "/hocuspocus",
      upgradeWebSocket((c) => {
        let clientConnection: ReturnType<typeof hocuspocus.hocuspocus.handleConnection>;
        return {
          onOpen(_evt, ws) {
            ws.raw!.binaryType = "arraybuffer";
            clientConnection = hocuspocus.hocuspocus.handleConnection(ws.raw!, c.req.raw, {});
          },
          onMessage(evt) {
            clientConnection?.handleMessage(new Uint8Array(evt.data as never));
          },
          onClose() {
            clientConnection?.handleClose();
          },
        };
      }),
    );

    app.use(contextMiddleware());
    for (const middlewareFn of middlewareFns) {
      app.use(middlewareFn());
    }
    app.use(middlewareRunner(middlewareModules));
    app.use(
      rscMiddleware({
        processRequest,
      }),
    );
    const buildOptions = {
      distDir: config.distDir,
    };

    const wss = new WebSocketServer({ noServer: true });
    const customServe: typeof serve = (options, listener) => {
      return serve(
        {
          ...options,
          websocket: {
            server: wss,
          },
        },
        (info) => {
          console.log("[started]");
          hocuspocus.hocuspocus.hooks("onListen", {
            instance: hocuspocus.hocuspocus,
            configuration: hocuspocus.configuration,
            port: info.port,
          });
          listener?.(info);
        },
      );
    };
    return {
      fetch: app.fetch,
      build: processBuild,
      buildOptions,
      buildEnhancers: ["waku/adapters/node-build-enhancer"],
      serve: customServe,
    };
  },
);
