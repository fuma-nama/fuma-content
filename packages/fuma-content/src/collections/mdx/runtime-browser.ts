import { type ReactNode, type FC, lazy, createElement } from "react";
import type { CompiledMDXProperties } from "@/collections/mdx/runtime";
import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import { CollectionMap } from "@/collections/runtime/store";
import { FileCollectionStore } from "@/collections/runtime/file-store";

export interface ClientLoaderOptions<Doc, Props> {
  /**
   * Loader ID (usually your collection name)
   *
   * The code splitting strategy of frameworks like Tanstack Start may duplicate `createClientLoader()` into different chunks.
   *
   * We use loader ID to share cache between multiple instances of client loader.
   *
   * @defaultValue ''
   */
  id?: string;

  component: (loaded: Doc, props: Props) => ReactNode;
}

export interface ClientLoader<Doc, Props> {
  preload: (id: string) => Promise<Doc>;
  /**
   * Get a component that renders content with `React.lazy`.
   */
  getComponent: (id: string) => FC<Props>;

  /**
   * Get react nodes that renders content with `React.lazy`.
   */
  useContent: (id: string, props: Props) => ReactNode;
}

export interface MDXMapBrowserEntry<Frontmatter> {
  load: () => Promise<CompiledMDXProperties<Frontmatter>>;
  loader: <Props extends object | undefined = object>(
    component: (
      loaded: CompiledMDXProperties<Frontmatter>,
      props: Props,
    ) => ReactNode,
  ) => FC<Props>;
  preload: () => Promise<CompiledMDXProperties<Frontmatter>>;
}

export function mdxStoreBrowser<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
): FileCollectionStore<{
  frontmatter: GetCollectionConfig<Config, Name> extends MDXCollection<
    infer Frontmatter
  >
    ? Frontmatter
    : never;
  load: () => Promise<
    CompiledMDXProperties<
      GetCollectionConfig<Config, Name> extends MDXCollection<infer Frontmatter>
        ? Frontmatter
        : never
    >
  >;
}> {
  type Frontmatter =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
      ? _Frontmatter
      : never;
  const input = _input as {
    head: Record<string, Frontmatter>;
    body: Record<string, () => Promise<CompiledMDXProperties<Frontmatter>>>;
  };

  const merged: Record<
    string,
    {
      frontmatter: Frontmatter;
      load: () => Promise<CompiledMDXProperties<Frontmatter>>;
    }
  > = {};

  for (const [key, value] of Object.entries(input.head)) {
    merged[key] = {
      frontmatter: value,
      load: input.body[key],
    };
  }

  return new FileCollectionStore(base, merged);
}

const loaderStore = new Map<
  string,
  {
    preloaded: Map<string, CompiledMDXProperties>;
  }
>();

export function mdxMapBrowser<Config, Name extends string>(
  _name: Name,
  input: Record<string, () => Promise<unknown>>,
) {
  type Frontmatter =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
      ? _Frontmatter
      : never;

  const store = new Map<string, MDXMapBrowserEntry<Frontmatter>>();

  for (let [globKey, value] of Object.entries(input)) {
    if (globKey.startsWith("./")) {
      globKey = globKey.slice(2);
    }

    const load = value as () => Promise<CompiledMDXProperties<Frontmatter>>;
    function getRenderer(path: string): FC<Props> {
      if (path in renderers) return renderers[path];

      const OnDemand = lazy(async () => {
        const loaded = await getLoader(path)();

        return { default: (props) => component(loaded, props) };
      });

      renderers[path] = (props) => {
        const cached = store.preloaded.get(path);
        if (!cached) return createElement(OnDemand, props);
        return component(cached, props);
      };
      return renderers[path];
    }

    store.set(
      globKey,
      value as () => Promise<CompiledMDXProperties<Frontmatter>>,
    );
  }

  return new CollectionMap(store);
}

const loaderStore = new Map<
  string,
  {
    preloaded: Map<string, CompiledMDXProperties>;
  }
>();

export function createClientLoader<
  Doc = CompiledMDXProperties,
  Props extends object = object,
>(
  globEntries: Record<string, () => Promise<Doc>>,
  options: ClientLoaderOptions<Doc, Props>,
): ClientLoader<Doc, Props> {
  const { id = "", component } = options;
  const renderers: Record<string, FC<Props>> = {};
  const loaders = new Map<string, () => Promise<Doc>>();
  const store = loaderStore.get(id) ?? {
    preloaded: new Map(),
  };
  loaderStore.set(id, store);

  for (const k in globEntries) {
    loaders.set(k.startsWith("./") ? k.slice(2) : k, globEntries[k]);
  }

  function getLoader(path: string) {
    const loader = loaders.get(path);
    if (!loader)
      throw new Error(
        `[createClientLoader] ${path} does not exist in available entries`,
      );
    return loader;
  }

  function getRenderer(path: string): FC<Props> {
    if (path in renderers) return renderers[path];

    const OnDemand = lazy(async () => {
      const loaded = await getLoader(path)();

      return { default: (props) => component(loaded, props) };
    });

    renderers[path] = (props) => {
      const cached = store.preloaded.get(path);
      if (!cached) return createElement(OnDemand, props);
      return component(cached, props);
    };
    return renderers[path];
  }

  return {
    async preload(path) {
      const loaded = await getLoader(path)();
      store.preloaded.set(path, loaded);
      return loaded;
    },
    getComponent(path) {
      return getRenderer(path);
    },
    useContent(path, props) {
      const Comp = this.getComponent(path);
      return createElement(Comp, props);
    },
  };
}
