import { Core, CoreOptions } from "@/core";
import type { InitializeHook, LoadFnOutput, LoadHook, LoadHookContext } from "node:module";
import { createCache } from "@/utils/async-cache";
import { createDynamicCore, DynamicCore } from "@/dynamic";
import { loaderPlugin } from "@/plugins/loader";

let configLoader: DynamicCore | undefined;

export type LoaderOptions = Omit<CoreOptions, "plugins" | "workspace">;

export const initialize: InitializeHook<LoaderOptions> = (options) => {
  configLoader = createDynamicCore({
    core: new Core({
      ...options,
      plugins: [loaderPlugin()],
    }),
    mode: "production",
  });
};

export const load: LoadHook = async (url, context, nextLoad) => {
  if (!configLoader) throw new Error("not initialized");
  const core = await configLoader.getCore();
  const store = createCache(core.cache).$value<LoadHook[]>();

  const hooks = await store.cached("node:load-hooks", async () => {
    const ctx = core.getPluginContext();

    const hooks = await Promise.all(
      core.getPlugins(true).map<Promise<LoadHook | undefined>>(async (plugin) => {
        return plugin.node?.createLoad?.call(ctx);
      }),
    );
    return hooks.filter((v) => v !== undefined);
  });

  function run(
    i: number,
    url: string,
    context: LoadHookContext,
  ): LoadFnOutput | Promise<LoadFnOutput> {
    if (i >= hooks.length) {
      return nextLoad(url, context);
    }

    return hooks[i](url, context, (url, ctx) => run(i + 1, url, { ...context, ...ctx }));
  }

  return run(0, url, context);
};
