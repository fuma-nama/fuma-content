import type { GetCollectionConfig } from "@/types";
import type { CollectionList } from "@/collections/list/runtime";
import { type FileInfo, globToFileList } from "@/collections/file-list/runtime";
import type { MetaCollection } from "@/collections/meta";

export interface MetaListEntry<Data> extends FileInfo {
  data: Data;
}

export function metaList<Config, Name extends string>(
  _name: Name,
  base: string,
  input: Record<string, unknown>,
) {
  type Metadata =
    GetCollectionConfig<Config, Name> extends MetaCollection<infer Data>
      ? Data
      : never;
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

  const list: CollectionList<MetaListEntry<Metadata>> = globToFileList(
    base,
    merged,
  );
  return list;
}
