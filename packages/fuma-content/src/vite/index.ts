import type { PluginOption } from "vite";
import type { FSWatcher } from "chokidar";
import { Core, type Plugin } from "@/core";

export interface PluginOptions {
  /**
   * @defaultValue content.config.ts
   */
  configPath?: string;

  /**
   * Output directory of generated files
   *
   * @defaultValue '.content'
   */
  outDir?: string;
}

export default async function content(
  config: Record<string, unknown>,
  pluginOptions: PluginOptions = {},
): Promise<PluginOption[]> {
  const options = applyDefaults(pluginOptions);
  const core = new Core(options);
  await core.init({
    config,
    plugins: [vitePlugin()],
  });

  const ctx = core.getPluginContext();
  return [
    ...core.getPlugins(true).map((plugin) => plugin.vite?.createPlugin?.call(ctx)),
    {
      name: "fuma-content",
      async buildStart() {
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

export async function createStandaloneCore(pluginOptions: PluginOptions = {}) {
  const { loadConfig } = await import("@/config/load-from-file");
  const core = new Core(applyDefaults(pluginOptions));
  await core.init({
    config: loadConfig(core, true),
    plugins: [vitePlugin()],
  });
  return core;
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

function applyDefaults(options: PluginOptions): Required<PluginOptions> {
  return {
    configPath: options.configPath ?? Core.defaultOptions.configPath,
    outDir: options.outDir ?? Core.defaultOptions.outDir,
  };
}
