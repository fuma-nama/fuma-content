"use client";

import type { Awaitable, GetCollectionConfig } from "@/types";
import { MapCollectionStore } from "@/collections/runtime/store";
import { type AsyncCache, createCache } from "@/utils/async-cache";
import type { CompiledMDX } from "@/collections/mdx/build-mdx";
import type { MDXCollection } from "../mdx";

export interface MDXStoreBrowserData<Frontmatter, Attached = unknown> {
  id: string;
  preload: () => Awaitable<CompiledMDX<Frontmatter> & Attached>;
  _store: StoreContext;
}

interface StoreContext {
  storeId: string;
}

interface StoreData {
  preloaded: AsyncCache<CompiledMDX>;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection
    ? GetCollectionConfig<Config, Name>["$inferFrontmatter"]
    : never;

export const _internal_data = new Map<string, StoreData>();

export function mdxStoreBrowser<Config, Name extends string, Attached>(
  name: Name,
  _input: Record<string, () => Promise<unknown>>,
): MapCollectionStore<string, MDXStoreBrowserData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as Record<
    string,
    () => Promise<CompiledMDX<GetFrontmatter<Config, Name>> & Attached>
  >;
  const merged = new Map<string, MDXStoreBrowserData<GetFrontmatter<Config, Name>, Attached>>();
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
          .preloaded.$value<CompiledMDX<GetFrontmatter<Config, Name>> & Attached>()
          .cached(key, value);
      },
      _store: context,
    });
  }

  return new MapCollectionStore(merged);
}

export type { WithExtractedReferences, WithGit } from "./runtime";
