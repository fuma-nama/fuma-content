import type { LoaderContext } from "webpack";
import { createDynamicCore } from "@/dynamic";
import { createMdxLoader } from "@/collections/mdx/loader";
import {
  getCore,
  toWebpack,
  type WebpackLoader,
  type WebpackLoaderOptions,
} from "@/plugins/with-loader/webpack";

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
