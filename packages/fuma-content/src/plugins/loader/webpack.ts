import { parse } from "node:querystring";
import { ValidationError } from "@/utils/validation";
import path from "node:path";
import { Core } from "@/core";
import { createDynamicCore, type DynamicCore } from "@/dynamic";
import type { LoaderContext } from "webpack";
import type { Loader } from "@/plugins/loader";

export interface WebpackLoaderOptions {
  absoluteCompiledConfigPath: string;
  configPath: string;
  outDir: string;
  isDev: boolean;
}

export type WebpackLoader = (this: LoaderContext<WebpackLoaderOptions>, source: string) => void;

const cachedCores = new Map<string, DynamicCore>();

function initDynamicCore({ configPath, isDev, outDir }: WebpackLoaderOptions) {
  const key = `${configPath}:${isDev}:${outDir}`;
  let res = cachedCores.get(key);
  if (res) return res;

  res = createDynamicCore({
    core: new Core({ configPath, outDir }),
    compileMode: "skip",
    mode: isDev ? "dev" : "production",
  });
  cachedCores.set(key, res);
  return res;
}

/**
 * Note: need to handle the `test` regex in Webpack config instead.
 */
export function createWebpackLoader(loaderFactory: (core: DynamicCore) => Loader): WebpackLoader {
  let loader: Loader | undefined;

  async function asyncLoader(
    this: LoaderContext<WebpackLoaderOptions>,
    source: string,
    callback: LoaderContext<WebpackLoaderOptions>["callback"],
  ) {
    const options = this.getOptions();
    this.cacheable(true);
    this.addDependency(options.absoluteCompiledConfigPath);

    if (!loader) {
      const core = initDynamicCore(options);
      loader = loaderFactory(core);
    }

    try {
      const result = await loader.load({
        filePath: this.resourcePath,
        query: parse(this.resourceQuery.slice(1)),
        getSource() {
          return source;
        },
        development: this.mode === "development",
        addDependency: (file) => {
          this.addDependency(file);
        },
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
  }

  return function loader(source) {
    return asyncLoader.call(this, source, this.async());
  };
}
