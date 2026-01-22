"use client";

import { type ReactNode, lazy, createElement } from "react";
import type { Awaitable, GetCollectionConfig } from "@/types";
import { MapCollectionStore } from "@/collections/runtime/store";
import { type AsyncCache, createCache } from "@/utils/async-cache";
import type { CompiledMDX } from "@/collections/mdx/build-mdx";
import type { MDXCollection } from "../mdx";

export interface MDXStoreBrowserData<Frontmatter, Attached = unknown> {
  id: string;
  preload: () => Awaitable<CompiledMDX<Frontmatter> & Attached>;
  _renderer: StoreRendererData;
}

interface StoreRendererData {
  storeId: string;
  renderers: Map<
    string,
    {
      fn: () => ReactNode;
      forceOnDemand: boolean;
    }
  >;
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

  const _renderer: StoreRendererData = {
    storeId: name,
    renderers: new Map(),
  };

  for (const [key, value] of Object.entries(input)) {
    merged.set(key, {
      id: key,
      preload() {
        return getStoreData()
          .preloaded.$value<CompiledMDX<GetFrontmatter<Config, Name>> & Attached>()
          .cached(key, value);
      },
      _renderer,
    });
  }

  return new MapCollectionStore(merged);
}

/**
 * Renders content with `React.lazy`.
 */
export function useRenderer<Frontmatter, Attached>(
  entry: MDXStoreBrowserData<Frontmatter, Attached> | undefined,
  renderFn: (data: CompiledMDX<Frontmatter> & Attached) => ReactNode,
): ReactNode {
  if (!entry) return null;
  const {
    id,
    _renderer: { renderers },
  } = entry;
  let renderer = renderers.get(id);

  if (!renderer) {
    const OnDemand = lazy(async () => {
      const loaded = await entry.preload();
      return { default: () => renderFn(loaded) };
    });

    renderer = {
      forceOnDemand: false,
      fn() {
        const v = entry.preload();
        if (!("then" in v) && !this.forceOnDemand) {
          return renderFn(v);
        }

        // ensure it won't unmount React lazy during re-renders
        this.forceOnDemand = true;
        return createElement(OnDemand);
      },
    };
    renderers.set(id, renderer);
  }

  return renderer.fn();
}

export type { WithExtractedReferences, WithGit } from "./runtime";
