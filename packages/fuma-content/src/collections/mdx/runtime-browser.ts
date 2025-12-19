"use client";

import { type ReactNode, lazy, createElement } from "react";
import type { CompiledMDXProperties } from "@/collections/mdx/runtime";
import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
import { SimpleCollectionStore } from "@/collections/runtime/store";
import type { VersionControlFileData } from "@/plugins/git";
import { type AsyncCache, createCache } from "@/utils/async-cache";

export interface MDXStoreBrowserData<Frontmatter, CustomData> {
  id: string;
  preload: () =>
    | (CompiledMDXProperties<Frontmatter> & CustomData)
    | Promise<CompiledMDXProperties<Frontmatter> & CustomData>;
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
  preloaded: AsyncCache<CompiledMDXProperties>;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
    ? _Frontmatter
    : never;

export const _internal_data = new Map<string, StoreData>();

export function mdxStoreBrowser<Config, Name extends string>(
  name: Name,
  _input: Record<string, () => Promise<unknown>>,
): SimpleCollectionStore<
  MDXStoreBrowserData<GetFrontmatter<Config, Name>, unknown>
> {
  const input = _input as Record<
    string,
    () => Promise<CompiledMDXProperties<GetFrontmatter<Config, Name>>>
  >;
  const merged = new Map<
    string,
    MDXStoreBrowserData<GetFrontmatter<Config, Name>, unknown>
  >();
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
          .preloaded.$value<
            CompiledMDXProperties<GetFrontmatter<Config, Name>>
          >()
          .cached(key, value);
      },
      _renderer,
    });
  }

  return new SimpleCollectionStore(merged);
}

/**
 * Renders content with `React.lazy`.
 */
export function useRenderer<Frontmatter, CustomData>(
  entry: MDXStoreBrowserData<Frontmatter, CustomData> | undefined,
  renderFn: (
    data: CompiledMDXProperties<Frontmatter> & CustomData,
  ) => ReactNode,
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
        if (!(v instanceof Promise) && !this.forceOnDemand) {
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

export function $attachCompiled<Add>() {
  return <T>(data: T) =>
    data as T extends MDXStoreBrowserData<infer Frontmatter, infer CustomData>
      ? MDXStoreBrowserData<Frontmatter, CustomData & Add>
      : T;
}

export function $extractedReferences() {
  return $attachCompiled<{
    /**
     * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
     */
    extractedReferences: ExtractedReference[];
  }>();
}

export function $versionControl() {
  return $attachCompiled<VersionControlFileData>();
}
