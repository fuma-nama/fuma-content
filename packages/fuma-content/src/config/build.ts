import type { GlobalConfig, WorkspaceConfig } from "@/config/define";
import type { Collection } from "@/config/collections";

export interface LoadedConfig {
  collections: Map<string, Collection>;
  global: GlobalConfig;
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

  for (const [k, v] of Object.entries(config)) {
    if (!v) {
      continue;
    }

    if (k === "default" && v) {
      Object.assign(loaded, v);
      continue;
    }

    if (typeof v === "object") {
      const casted = v as unknown as Collection;
      casted.init?.({ name: k, workspace });
      collections.set(k, casted);
      continue;
    }

    throw new Error(
      `Unknown export "${k}", you can only export collections from configuration file.`,
    );
  }

  return {
    global: loaded,
    collections,
    workspaces: Object.fromEntries(
      Object.entries(loaded.workspaces ?? {}).map(([key, value]) => {
        return [
          key,
          {
            dir: value.dir,
            config: buildConfig(value.config, { ...value, name: key }),
          },
        ];
      }),
    ),
  };
}
