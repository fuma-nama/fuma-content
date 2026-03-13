import type { GetCollectionConfig } from "@/types";
import { FileCollectionStore } from "@/collections/runtime/file-store";

export function dataStore<Config, Name extends string>(
  _name: Name,
  base: string,
  input: Record<string, unknown>,
): FileCollectionStore<{
  data: GetCollectionConfig<Config, Name> extends { $inferOutput: unknown }
    ? GetCollectionConfig<Config, Name>["$inferOutput"]
    : never;
}> {
  type Data =
    GetCollectionConfig<Config, Name> extends { $inferOutput: unknown }
      ? GetCollectionConfig<Config, Name>["$inferOutput"]
      : never;
  const merged: Record<
    string,
    {
      data: Data;
    }
  > = {};

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      data: value as Data,
    };
  }

  return new FileCollectionStore(base, merged);
}
