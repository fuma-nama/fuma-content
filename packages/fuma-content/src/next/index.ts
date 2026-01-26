import type { NextConfig } from "next";
import path from "node:path";
import { loadConfig } from "@/config/load-from-file";
import { Core, CoreOptions } from "@/core";
import type { FSWatcher } from "chokidar";
import { loaderPlugin } from "@/plugins/loader";

export interface NextOptions extends Pick<CoreOptions, "cwd" | "configPath" | "outDir"> {
  /**
   * clean output directory on start
   *
   * @defaultValue true
   */
  clean?: boolean;
}

export async function createContent(options: NextOptions = {}) {
  const { clean = true } = options;
  const isFirstStart = process.env._FUMA_CONTENT !== "1";
  process.env._FUMA_CONTENT = "1";

  const core = createNextCore(options);
  if (clean && isFirstStart) {
    await core.clearOutputDirectory();
  }

  await core.init({
    config: loadConfig(core, true),
  });

  if (isFirstStart) {
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
  await core.emit({ write: true });

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

    watcher.once("ready", () => {
      console.log("[fuma-content] started dev server");
    });

    watcher.on("all", (_event, file) => {
      if (path.resolve(file) === absoluteConfigPath) {
        console.log("[fuma-content] restarting dev server");
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
    console.log("[fuma-content] closing dev server");
    void watcher.close();
  });

  await devServer();
}

export async function createStandaloneCore(options: NextOptions) {
  const core = createNextCore(options);
  await core.init({
    config: loadConfig(core, true),
  });
  return core;
}

function createNextCore({ configPath, cwd, outDir }: NextOptions): Core {
  return new Core({
    configPath,
    cwd,
    outDir,
    plugins: [loaderPlugin()],
  });
}
