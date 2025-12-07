import type { LoaderContext } from "webpack";
import { createDynamicCore } from "@/config/dynamic";
import { getCore, type WebpackLoaderOptions } from "@/webpack";
import { createMdxLoader } from "@/config/collections/mdx/loader";
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
      createMdxLoader(
        createDynamicCore({
          core: getCore(options),
          buildConfig: false,
          mode: options.isDev ? "dev" : "production",
        }),
      ),
    );
  }

  await instance.call(this, source, callback);
}
