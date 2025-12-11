export interface AsyncCache<V> {
  store: Map<string, V | Promise<V>>;
  cached: (key: string, fn: () => V | Promise<V>) => V | Promise<V>;
}

export function createCache<V>(
  store = new Map<string, V | Promise<V>>(),
): AsyncCache<V> {
  return {
    store,
    cached(key, fn) {
      let cached = store.get(key);
      if (cached) return cached;
      cached = fn();
      store.set(key, cached);
      return cached;
    },
  };
}
