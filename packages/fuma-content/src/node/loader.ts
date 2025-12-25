import { Core } from "@/core";
import type { LoadFnOutput, LoadHook, LoadHookContext } from "node:module";
import { createCache } from "@/utils/async-cache";
import { createDynamicCore } from "@/dynamic";

const configLoader = createDynamicCore({
  core: new Core({
    configPath: Core.defaultOptions.configPath,
    outDir: Core.defaultOptions.outDir,
  }),
  buildConfig: true,
  mode: "production",
});

export const load: LoadHook = async (url, context, nextLoad) => {
  const core = await configLoader.getCore();
  const store = createCache(core.cache as Map<string, LoadHook[]>);

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
