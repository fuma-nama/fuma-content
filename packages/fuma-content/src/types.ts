import type { GlobalConfig } from "@/config";

export type GetCollectionConfig<Config, Name extends string> =
  Config extends GlobalConfig<infer Collections> ? Collections[Name] : never;
