import type { PluginOption } from "vite";
import { buildConfig } from "@/config/build";
import type { FSWatcher } from "chokidar";
import { _Defaults, createCore } from "@/core";
import indexFile, { type IndexFilePluginOptions } from "@/plugins/index-file";

export interface PluginOptions {
  /**
   * Generate index files for accessing content.
   *
   * @defaultValue true
   */
  index?: boolean | IndexFilePluginOptions;

  /**
   * @defaultValue source.config.ts
   */
  configPath?: string;

  /**
   * Update Vite config to fix module resolution of Fumadocs
   *
   * @defaultValue true
   */
  updateViteConfig?: boolean;

  /**
   * Output directory of generated files
   *
   * @defaultValue '.source'
   */
  outDir?: string;
}

export default async function content(
  config: Record<string, unknown>,
  pluginOptions: PluginOptions = {},
): Promise<PluginOption> {
  const options = applyDefaults(pluginOptions);
  const core = createViteCore(options);
  await core.init({
    config: buildConfig(config),
  });

  const ctx = core.getPluginContext();
  return [
    ...core
      .getPlugins(true)
      .map((plugin) => plugin.vite?.createPlugin?.call(ctx)),
    {
      name: "fuma-content",
      // needed, otherwise other plugins will be executed before our `transform`.
      enforce: "pre",
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
  const core = createViteCore(applyDefaults(pluginOptions));
  await core.init({
    config: loadConfig(core, true),
  });
  return core;
}

function createViteCore({
  index,
  configPath,
  outDir,
}: Required<PluginOptions>) {
  if (index === true) index = {};

  return createCore({
    environment: "vite",
    configPath,
    outDir,
    plugins: [
      index &&
        indexFile({
          ...index,
          target: index.target ?? "vite",
        }),
    ],
  });
}

function applyDefaults(options: PluginOptions): Required<PluginOptions> {
  return {
    updateViteConfig: options.updateViteConfig ?? true,
    index: options.index ?? true,
    configPath: options.configPath ?? _Defaults.configPath,
    outDir: options.outDir ?? _Defaults.outDir,
  };
}
