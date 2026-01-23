import type { Core } from "@/core";
import fs from "node:fs/promises";

export interface DynamicCore {
  getCore(): Core | Promise<Core>;
}

export function createDynamicCore({
  core,
  buildConfig,
  mode,
}: {
  /**
   * core (not initialized)
   */
  core: Core;
  buildConfig: boolean;
  /**
   * In dev mode, the config file is dynamically re-loaded when it's updated.
   */
  mode: "dev" | "production";
}): DynamicCore {
  let prev:
    | {
        hash: string;
        init: Promise<void>;
      }
    | undefined;

  async function getConfigHash(): Promise<string> {
    if (mode === "production") return "static";

    const stats = await fs.stat(core.getOptions().configPath).catch(() => {
      throw new Error("Cannot find config file");
    });

    return stats.mtime.getTime().toString();
  }

  async function init() {
    const { loadConfig } = await import("./config/load-from-file");
    await core.init({
      config: loadConfig(core, buildConfig),
    });
  }

  return {
    async getCore() {
      const hash = await getConfigHash();
      if (!prev || hash !== prev.hash) {
        prev = {
          hash,
          init: init(),
        };
      }

      await prev.init;
      return core;
    },
  };
}
