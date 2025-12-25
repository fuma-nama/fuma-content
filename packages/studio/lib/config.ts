import { Core } from "fuma-content";
import { buildConfig } from "fuma-content/config";

let core: Core;

export async function getCore(): Promise<Core> {
  if (core) return core;

  core = new Core({
    outDir: ".content",
    configPath: "content.config.ts",
  });

  await core.init({
    config: buildConfig(await import("@/content.config")),
  });

  return core;
}
