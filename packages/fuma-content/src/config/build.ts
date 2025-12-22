import type { GlobalConfig, WorkspaceConfig } from "@/config/index";
import type { Collection } from "@/collections";

export interface LoadedConfig extends Omit<GlobalConfig, "workspaces" | "collections"> {
  collections: Map<string, Collection>;
  workspaces: Record<
    string,
    {
      dir: string;
      config: LoadedConfig;
    }
  >;
}

/**
 * @param config - either the default export or all exports of config file.
 * @param workspace
 */
export function buildConfig(
  config: Record<string, unknown>,
  workspace?: WorkspaceConfig,
): LoadedConfig {
  const collections = new Map<string, Collection>();
  const loaded: GlobalConfig = {};
  let globalConfig: GlobalConfig;

  if ("default" in config) {
    globalConfig = config.default as GlobalConfig;
    for (const [k, v] of Object.entries(config)) {
      if (k === "default") continue;

      globalConfig.collections ??= {};
      globalConfig.collections[k] = v as Collection;
    }
  } else {
    globalConfig = config as GlobalConfig;
  }

  if (globalConfig.collections) {
    for (const [name, collection] of Object.entries(globalConfig.collections)) {
      collection.init?.({ name, workspace });
      collections.set(name, collection);
    }
  }

  return {
    ...globalConfig,
    collections,
    workspaces: Object.fromEntries(
      Object.entries(loaded.workspaces ?? {}).map(([key, value]) => {
        return [
          key,
          {
            dir: value.dir,
            config: buildConfig(value.config as Record<string, unknown>, {
              ...value,
              name: key,
            }),
          },
        ];
      }),
    ),
  };
}
