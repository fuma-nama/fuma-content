"use client";

import { type ReactNode, type FC, lazy, createElement } from "react";
import type { CompiledMDXProperties } from "@/collections/mdx/runtime";
import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
import { SimpleCollectionStore } from "@/collections/runtime/store";
import type { VersionControlFileData } from "@/plugins/git";

export interface MDXStoreBrowserData<Frontmatter, CustomData> {
  preload: () => Promise<CompiledMDXProperties<Frontmatter> & CustomData>;

  _renderer: {
    id: string;
    renderers?: Map<string, FC>;
    getStoreData: () => StoreData;
  };
}

interface StoreData {
  preloaded: Map<string, Promise<CompiledMDXProperties>>;
}

export const _internal_data = new Map<string, StoreData>();

export function mdxStoreBrowser<Config, Name extends string>(
  name: Name,
  _input: Record<string, () => Promise<unknown>>,
): SimpleCollectionStore<
  MDXStoreBrowserData<
    GetCollectionConfig<Config, Name> extends MDXCollection<infer Frontmatter>
      ? Frontmatter
      : never,
    unknown
  >
> {
  type Frontmatter =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
      ? _Frontmatter
      : never;
  const input = _input as Record<
    string,
    () => Promise<CompiledMDXProperties<Frontmatter>>
  >;
  const merged = new Map<string, MDXStoreBrowserData<Frontmatter, unknown>>();
  function getStoreData() {
    const store = _internal_data.get(name) ?? {
      preloaded: new Map(),
    };
    _internal_data.set(name, store);
    return store;
  }

  for (const [key, value] of Object.entries(input)) {
    merged.set(key, {
      preload() {
        const data = getStoreData();
        const loaded = value();
        data.preloaded.set(key, loaded);
        return loaded;
      },
      _renderer: {
        id: key,
        getStoreData,
      },
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
  entry._renderer.renderers ??= new Map();
  const { id, renderers, getStoreData } = entry._renderer;
  let renderer = renderers.get(id);

  if (!renderer) {
    const OnDemand = lazy(async () => {
      const loaded = await entry.preload();

      return { default: () => renderFn(loaded) };
    });

    renderer = () => {
      const data = getStoreData();
      let cached: (CompiledMDXProperties<Frontmatter> & CustomData) | undefined;
      data.preloaded.get(id)?.then((v) => {
        cached = v as CompiledMDXProperties<Frontmatter> & CustomData;
      });
      if (!cached) return createElement(OnDemand);
      return renderFn(cached);
    };
    renderers.set(id, renderer);
  }

  return createElement(renderer);
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
