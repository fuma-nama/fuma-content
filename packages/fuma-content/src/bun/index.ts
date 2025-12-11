import type { BunPlugin } from "bun";
import { buildConfig } from "@/config/build";
import { pathToFileURL } from "node:url";
import { type CoreOptions, Core } from "@/core";

export type ContentPluginOptions = Partial<CoreOptions>;

export function createContentPlugin(
  options: ContentPluginOptions = {},
): BunPlugin {
  const {
    outDir = Core.defaultOptions.outDir,
    configPath = Core.defaultOptions.configPath,
  } = options;

  return {
    name: "fuma-content",
    async setup(build) {
      const importPath = pathToFileURL(configPath).href;
      const core = new Core({
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
