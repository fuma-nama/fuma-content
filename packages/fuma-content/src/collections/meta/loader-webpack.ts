import type { LoaderContext } from "webpack";
import { createMetaLoader } from "@/collections/meta/loader";
import {
  toWebpack,
  getCore,
  type WebpackLoader,
  type WebpackLoaderOptions,
} from "@/plugins/with-loader/webpack";
import { createDynamicCore } from "@/config/dynamic";

let instance: WebpackLoader | undefined;

export default async function loader(
  this: LoaderContext<WebpackLoaderOptions>,
  source: string,
): Promise<void> {
  const callback = this.async();
  const options = this.getOptions();
  this.cacheable(true);
  this.addDependency(options.absoluteCompiledConfigPath);

  if (!instance) {
    instance = toWebpack(
      createMetaLoader(
        createDynamicCore({
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
