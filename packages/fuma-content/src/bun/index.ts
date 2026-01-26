import type { BunPlugin } from "bun";
import { pathToFileURL } from "node:url";
import { type CoreOptions, Core } from "@/core";
import { loaderPlugin } from "@/plugins/loader";

export type BunOptions = Omit<CoreOptions, "plugins" | "workspace">;

export async function createContent(options: BunOptions): Promise<BunCore> {
  const core = new BunCore({
    ...options,
    plugins: [loaderPlugin()],
  });
  const importPath = pathToFileURL(core.getOptions().configPath).href;

  await core.init({
    config: await import(importPath),
  });
  return core;
}

export class BunCore extends Core {
  createBunPlugin(): BunPlugin {
    return {
      name: "fuma-content",
      setup: async (build) => {
        const ctx = this.getPluginContext();

        for (const plugin of this.getPlugins(true)) {
          const setup = plugin.bun?.setup;
          if (setup) await setup.call(ctx, build);
        }
      },
    };
  }
}
