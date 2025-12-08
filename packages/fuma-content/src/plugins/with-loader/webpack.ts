import type { LoaderContext } from "webpack";
import { parse } from "node:querystring";
import { ValidationError } from "@/utils/validation";
import path from "node:path";
import type { Loader } from "@/plugins/with-loader";
import { type Core, createCore } from "@/core";

export type WebpackLoader = (
  this: LoaderContext<unknown>,
  source: string,
  callback: LoaderContext<unknown>["callback"],
) => Promise<void>;

export interface WebpackLoaderOptions {
  absoluteCompiledConfigPath: string;
  configPath: string;
  outDir: string;
  isDev: boolean;
}

let core: Core;

export function getCore(options: WebpackLoaderOptions) {
  return (core ??= createCore({
    environment: "webpack",
    outDir: options.outDir,
    configPath: options.configPath,
  }));
}

/**
 * need to handle the `test` regex in Webpack config instead.
 */
export function toWebpack(loader: Loader): WebpackLoader {
  return async function (source, callback) {
    try {
      const result = await loader.load({
        filePath: this.resourcePath,
        query: parse(this.resourceQuery.slice(1)),
        getSource() {
          return source;
        },
        development: this.mode === "development",
        compiler: this,
      });

      if (result === null) {
        callback(undefined, source);
      } else {
        callback(undefined, result.code, result.map as string);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return callback(new Error(await error.toStringFormatted()));
      }

      if (!(error instanceof Error)) throw error;

      const fpath = path.relative(this.context, this.resourcePath);
      error.message = `${fpath}:${error.name}: ${error.message}`;
      callback(error);
    }
  };
}
