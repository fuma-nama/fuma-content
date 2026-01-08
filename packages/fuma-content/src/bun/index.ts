import type { BunPlugin } from "bun";
import { pathToFileURL } from "node:url";
import { type CoreOptions, Core } from "@/core";

export type ContentPluginOptions = Partial<CoreOptions>;

export function createContentPlugin(options: ContentPluginOptions = {}): BunPlugin {
  return {
    name: "fuma-content",
    async setup(build) {
      const core = new Core(options);
      const importPath = pathToFileURL(core.getOptions().configPath).href;

      await core.init({
        config: await import(importPath),
      });

      const ctx = core.getPluginContext();
      for (const plugin of core.getPlugins(true)) {
        await plugin.bun?.build?.call(ctx, build);
      }
    },
  };
}
