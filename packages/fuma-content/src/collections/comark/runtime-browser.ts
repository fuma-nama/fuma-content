"use client";

import type { Awaitable, GetCollectionConfig } from "@/types";
import { MapCollectionStore } from "@/collections/runtime/store";
import { type AsyncCache, createCache } from "@/utils/async-cache";
import type { ParsedComark } from "@/collections/comark/runtime";

export interface ComarkStoreBrowserData<Frontmatter, Attached = unknown> {
  id: string;
  preload: () => Awaitable<ParsedComark<Frontmatter> & Attached>;
  _store: StoreContext;
}

interface StoreContext {
  storeId: string;
}

interface StoreData {
  preloaded: AsyncCache<ParsedComark<unknown>>;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends { $inferFrontmatter: unknown }
    ? GetCollectionConfig<Config, Name>["$inferFrontmatter"]
    : never;

export const _internal_data = new Map<string, StoreData>();

export function comarkStoreBrowser<Config, Name extends string, Attached>(
  name: Name,
  _input: Record<string, () => Promise<unknown>>,
): MapCollectionStore<string, ComarkStoreBrowserData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as Record<
    string,
    () => Promise<ParsedComark<GetFrontmatter<Config, Name>> & Attached>
  >;
  const merged = new Map<string, ComarkStoreBrowserData<GetFrontmatter<Config, Name>, Attached>>();
  function getStoreData(): StoreData {
    let store = _internal_data.get(name);
    if (store) return store;

    store = {
      preloaded: createCache(),
    };
    _internal_data.set(name, store);
    return store;
  }

  const context: StoreContext = {
    storeId: name,
  };

  for (const [key, value] of Object.entries(input)) {
    merged.set(key, {
      id: key,
      preload() {
        return getStoreData()
          .preloaded.$value<ParsedComark<GetFrontmatter<Config, Name>> & Attached>()
          .cached(key, value);
      },
      _store: context,
    });
  }

  return new MapCollectionStore(merged);
}
