import type { NextConfig } from "next";
import * as path from "node:path";
import { loadConfig } from "@/config/load-from-file";
import { _Defaults, Core } from "@/core";
import type { IndexFilePluginOptions } from "@/plugins/entry-file";
import entryFile from "@/plugins/entry-file";

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

  index?: IndexFilePluginOptions | false;
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
  async function update() {
    await core.init({
      config: loadConfig(core, true),
    });
    await core.emit({ write: true });
  }

  async function devServer() {
    const { FSWatcher } = await import("chokidar");
    const { configPath, outDir } = core.getOptions();
    const watcher = new FSWatcher({
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

    watcher.on("ready", () => {
      console.log("[MDX] started dev server");
    });

    const absoluteConfigPath = path.resolve(configPath);
    watcher.on("all", async (_event, file) => {
      if (path.resolve(file) === absoluteConfigPath) {
        // skip plugin listeners
        watcher.removeAllListeners();

        await watcher.close();
        await update();
        console.log("[MDX] restarting dev server");
        await devServer();
      }
    });

    process.on("exit", () => {
      if (watcher.closed) return;

      console.log("[MDX] closing dev server");
      void watcher.close();
    });

    await core.initServer({ watcher });
  }

  if (dev) {
    await devServer();
  }
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
    index: {},
    outDir: options.outDir ?? _Defaults.outDir,
    configPath: options.configPath ?? _Defaults.configPath,
  };
}

function createNextCore(options: Required<NextOptions>): Core {
  return new Core({
    environment: "next",
    outDir: options.outDir,
    configPath: options.configPath,
    plugins: [options.index && entryFile(options.index)],
  });
}
