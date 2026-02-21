/**
 * cloned from https://github.com/remix-run/react-router/blob/main/packages/react-router-serve/cli.ts as it is not exported from their package
 */
import path from "node:path";
import url from "node:url";
import type { ServerBuild } from "react-router";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import expressWebsockets from "express-ws";
import { createHocuspocus } from "./hocuspocus";

Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? "production",
});

run();

type RSCServerBuildModule = {
  default: {
    fetch: (request: Request) => Response | Promise<Response>;
  };
  unstable_reactRouterServeConfig?: {
    publicPath: string;
    assetsBuildDirectory: string;
  };
};

type NormalizedBuild = {
  fetch?: (request: Request) => Response | Promise<Response>;
  publicPath: string;
  assetsBuildDirectory: string;
};

function isRSCServerBuild(build: unknown): build is RSCServerBuildModule {
  return Boolean(
    typeof build === "object" &&
    build &&
    "default" in build &&
    typeof build.default === "object" &&
    build.default &&
    "fetch" in build.default &&
    typeof build.default.fetch === "function",
  );
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function run() {
  const port = parseNumber(process.env.PORT) ?? 3000;
  const buildPath = path.resolve(process.argv[2]);
  const buildModule = await import(url.pathToFileURL(buildPath).href);
  const isRSCBuild = isRSCServerBuild(buildModule);
  let build: NormalizedBuild;

  if (isRSCBuild) {
    const config = {
      publicPath: "/",
      assetsBuildDirectory: "../client",
      ...(buildModule.unstable_reactRouterServeConfig || {}),
    };
    build = {
      fetch: buildModule.default.fetch,
      publicPath: config.publicPath,
      assetsBuildDirectory: path.resolve(path.dirname(buildPath), config.assetsBuildDirectory),
    } satisfies NormalizedBuild;
  } else {
    build = buildModule as ServerBuild;
  }

  const { app } = expressWebsockets(express());
  createHocuspocus(app);
  app.disable("x-powered-by");

  app.use(
    path.posix.join(build.publicPath, "assets"),
    express.static(path.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(build.publicPath, express.static(build.assetsBuildDirectory));
  app.use(express.static("public", { maxAge: "1h" }));

  if (build.fetch) {
    app.all("/{*splat}", createRequestListener(build.fetch));
  } else {
    app.all(
      "/{*splat}",
      createRequestHandler({
        build: buildModule,
        mode: process.env.NODE_ENV,
      }),
    );
  }

  function onListen() {
    console.log(`[started]`);
  }

  const server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  for (const signal of ["SIGTERM", "SIGINT"])
    process.once(signal, () => {
      server.close(console.error);
    });
}
