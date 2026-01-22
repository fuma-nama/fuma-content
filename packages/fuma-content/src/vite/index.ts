import type { PluginOption } from "vite";
import type { FSWatcher } from "chokidar";
import { Core, type Plugin } from "@/core";
import { loaderPlugin } from "@/plugins/with-loader";

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

  /**
   * clean output directory on start
   *
   * @defaultValue true
   */
  clean?: boolean;
}

export default async function content(
  config: Record<string, unknown>,
  _pluginOpitons: PluginOptions = {},
): Promise<PluginOption[]> {
  const pluginOpitons = applyDefaults(_pluginOpitons);
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
        if (pluginOpitons.clean) await core.clearOutputDirectory();
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

function createViteCore({ configPath, outDir }: Required<PluginOptions>) {
  return new Core({
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
  const core = createViteCore(applyDefaults(pluginOptions));
  await core.init({
    config: loadConfig(core, true),
  });
  return core;
}

function applyDefaults(options: PluginOptions): Required<PluginOptions> {
  return {
    configPath: options.configPath ?? Core.defaultOptions.configPath,
    outDir: options.outDir ?? Core.defaultOptions.outDir,
    clean: options.clean ?? true,
  };
}
