import type { BunPlugin } from "bun";
import { buildConfig } from "@/config/build";
import { pathToFileURL } from "node:url";
import { _Defaults, type CoreOptions, Core } from "@/core";

export type ContentPluginOptions = Partial<CoreOptions>;

export function createContentPlugin(
  options: ContentPluginOptions = {},
): BunPlugin {
  const {
    environment = "bun",
    outDir = _Defaults.outDir,
    configPath = _Defaults.configPath,
  } = options;

  return {
    name: "fuma-content",
    async setup(build) {
      const importPath = pathToFileURL(configPath).href;
      const core = new Core({
        environment,
        outDir,
        configPath,
      });

      await core.init({
        config: buildConfig(await import(importPath)),
      });

      const ctx = core.getPluginContext();
      for (const plugin of core.getPlugins(true)) {
        await plugin.bun?.build?.call(ctx, build);
      }
    },
  };
}
