import type { GetCollectionConfig } from "@/types";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { MetaCollection } from "@/collections/meta";

export function metaStore<Config, Name extends string>(
  _name: Name,
  base: string,
  input: Record<string, unknown>,
): FileCollectionStore<{
  data: GetCollectionConfig<Config, Name> extends MetaCollection<infer Data> ? Data : never;
}> {
  type Metadata =
    GetCollectionConfig<Config, Name> extends MetaCollection<infer Data> ? Data : never;
  const merged: Record<
    string,
    {
      data: Metadata;
    }
  > = {};

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      data: value as Metadata,
    };
  }

  return new FileCollectionStore(base, merged);
}
