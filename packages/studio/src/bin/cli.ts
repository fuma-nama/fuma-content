/**
 * cloned from https://github.com/remix-run/react-router/blob/main/packages/react-router-serve/cli.ts as it is not exported from their package
 */
import os from "node:os";
import path from "node:path";
import url from "node:url";
import type { ServerBuild } from "react-router";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";

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
  let port = parseNumber(process.env.PORT) ?? 3000;

  let buildPathArg = process.argv[2];

  if (!buildPathArg) {
    console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
    process.exit(1);
  }

  let buildPath = path.resolve(buildPathArg);

  let buildModule = await import(url.pathToFileURL(buildPath).href);
  let build: NormalizedBuild;
  let isRSCBuild = false;

  if ((isRSCBuild = isRSCServerBuild(buildModule))) {
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

  let onListen = () => {
    let address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;

    if (!address) {
      console.log(`[react-router-serve] http://localhost:${port}`);
    } else {
      console.log(`[react-router-serve] http://localhost:${port} (http://${address}:${port})`);
    }
  };

  let app = express();
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

  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
