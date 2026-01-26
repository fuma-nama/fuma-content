import type { PluginOption } from "vite";
import type { FSWatcher } from "chokidar";
import { Core, CoreOptions, type Plugin } from "@/core";
import { loaderPlugin } from "@/plugins/loader";

export interface PluginOptions extends Pick<CoreOptions, "configPath" | "cwd" | "outDir"> {
  /**
   * clean output directory on start
   *
   * @defaultValue true
   */
  clean?: boolean;
}

export default async function content(
  config: Record<string, unknown>,
  pluginOpitons: PluginOptions = {},
): Promise<PluginOption[]> {
  const { clean = true } = pluginOpitons;
  const core = createViteCore(pluginOpitons);
  await core.init({
    config,
  });

  const ctx = core.getPluginContext();
  return [
    ...core.getPlugins(true).map((plugin) => plugin.vite?.createPlugin?.call(ctx)),
    {
      name: "fuma-content",
      async buildStart() {
        if (clean) await core.clearOutputDirectory();
        await core.emit({ write: true });
      },
      async configureServer(server) {
        await core.initServer({
          watcher: server.watcher as unknown as FSWatcher,
        });
      },
    },
  ];
}

function createViteCore({ configPath, outDir, cwd }: PluginOptions) {
  return new Core({
    cwd,
    configPath,
    outDir,
    plugins: [vitePlugin(), loaderPlugin()],
  });
}

function vitePlugin(): Plugin {
  return {
    name: "vite",
    config(config) {
      config.emit ??= {
        target: "vite",
        jsExtension: false,
      };
    },
  };
}

export async function createStandaloneCore(pluginOptions: PluginOptions = {}) {
  const { loadConfig } = await import("@/config/load-from-file");
  const core = createViteCore(pluginOptions);
  await core.init({
    config: loadConfig(core, true),
  });
  return core;
}
