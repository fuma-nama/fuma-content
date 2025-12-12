import type { NextConfig } from "next";
import * as path from "node:path";
import { loadConfig } from "@/config/load-from-file";
import { Core } from "@/core";
import type { FSWatcher } from "chokidar";

export interface NextOptions {
  /**
   * Path to source configuration file
   */
  configPath?: string;

  /**
   * Directory for output files
   *
   * @defaultValue '.content'
   */
  outDir?: string;
}

export async function createContent(nextOptions: NextOptions = {}) {
  const core = createNextCore(applyDefaults(nextOptions));
  await core.init({
    config: loadConfig(core, true),
  });

  if (process.env._FUMADOCS_MDX !== "1") {
    process.env._FUMADOCS_MDX = "1";

    await core.emit({ write: true });
    await init(process.env.NODE_ENV === "development", core);
  }

  return (nextConfig: NextConfig = {}): NextConfig => {
    const ctx = core.getPluginContext();
    for (const plugin of core.getPlugins(true)) {
      nextConfig = plugin.next?.config?.call(ctx, nextConfig) ?? nextConfig;
    }

    return nextConfig;
  };
}

async function init(dev: boolean, core: Core): Promise<void> {
  if (!dev) return;
  const { FSWatcher } = await import("chokidar");
  const { configPath, outDir } = core.getOptions();
  const absoluteConfigPath = path.resolve(configPath);
  let watcher: FSWatcher | undefined;

  async function devServer() {
    if (watcher && !watcher.closed) {
      await watcher.close();
    }

    watcher = new FSWatcher({
      ignoreInitial: true,
      persistent: true,
      ignored: [outDir],
    });
    watcher.add(configPath);
    for (const collection of core.getCollections(true)) {
      const handler = collection.handlers.fs;
      if (handler) {
        watcher.add(handler.dir);
      }
    }

    watcher.once("ready", () => {
      console.log("[MDX] started dev server");
    });

    watcher.on("all", (_event, file) => {
      if (path.resolve(file) === absoluteConfigPath) {
        console.log("[MDX] restarting dev server");
        watcher?.removeAllListeners();
        void (async () => {
          await core.init({
            config: loadConfig(core, true),
          });
          await devServer();
          await core.emit({ write: true });
        })();
      }
    });

    await core.initServer({ watcher });
  }

  process.on("exit", () => {
    if (!watcher || watcher.closed) return;
    console.log("[MDX] closing dev server");
    void watcher.close();
  });

  await devServer();
}

export async function createStandaloneCore(options: NextOptions) {
  const core = createNextCore(applyDefaults(options));
  await core.init({
    config: loadConfig(core, true),
  });
  return core;
}

function applyDefaults(options: NextOptions): Required<NextOptions> {
  return {
    outDir: options.outDir ?? Core.defaultOptions.outDir,
    configPath: options.configPath ?? Core.defaultOptions.configPath,
  };
}

function createNextCore(options: Required<NextOptions>): Core {
  return new Core({
    outDir: options.outDir,
    configPath: options.configPath,
  });
}
