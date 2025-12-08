import type { GlobalConfig, WorkspaceConfig } from "@/config/index";
import type { Collection } from "@/collections";

export interface LoadedConfig extends Omit<
  GlobalConfig,
  "workspaces" | "collections"
> {
  collections: Map<string, Collection>;
  workspaces: Record<
    string,
    {
      dir: string;
      config: LoadedConfig;
    }
  >;
}

export function buildConfig(
  config: Record<string, unknown>,
  workspace?: WorkspaceConfig,
): LoadedConfig {
  const collections = new Map<string, Collection>();
  const loaded: GlobalConfig = {};
  const globalConfig = (config.default ?? config) as GlobalConfig;

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
