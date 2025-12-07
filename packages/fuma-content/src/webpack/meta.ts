import type { LoaderContext } from "webpack";
import { createStandaloneConfigLoader } from "@/loaders/config";
import { getCore, type WebpackLoaderOptions } from "@/webpack";
import { createMetaLoader } from "@/config/collections/meta/loader";
import { toWebpack, type WebpackLoader } from "@/plugins/with-loader/webpack";

let instance: WebpackLoader | undefined;

export default async function loader(
  this: LoaderContext<WebpackLoaderOptions>,
  source: string,
  callback: LoaderContext<WebpackLoaderOptions>["callback"],
): Promise<void> {
  const options = this.getOptions();
  this.cacheable(true);
  this.addDependency(options.absoluteCompiledConfigPath);

  if (!instance) {
    instance = toWebpack(
      createMetaLoader(
        createStandaloneConfigLoader({
          core: getCore(options),
          buildConfig: false,
          mode: options.isDev ? "dev" : "production",
        }),
        {
          json: "json",
          yaml: "js",
        },
      ),
    );
  }

  await instance.call(this, source, callback);
}
