import type { GlobalConfig } from "@/config";
import type { Collection } from "@/collections";

// `Config` should be an object of all exports in config file.
export type GetCollectionConfig<Config, Name extends string> =
  Config extends Record<Name, Collection>
    ? Config[Name]
    : Config extends {
          default: GlobalConfig<infer Collections>;
        }
      ? Collections[Name]
      : never;
