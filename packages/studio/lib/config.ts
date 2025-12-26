import { Core } from "fuma-content";
import { buildConfig } from "fuma-content/config";

let core: Promise<Core>;

export async function getCore(): Promise<Core> {
  core ??= (async () => {
    const core = new Core({
      outDir: ".content",
      configPath: "content.config.ts",
    });

    await core.init({
      config: buildConfig(await import("@/content.config")),
    });

    return core;
  })();

  return core;
}
