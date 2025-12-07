export function createCache<V>(store = new Map<string, V | Promise<V>>()) {
  return {
    store,
    cached(key: string, fn: () => V | Promise<V>): V | Promise<V> {
      let cached = store.get(key);
      if (cached) return cached;
      cached = fn();
      store.set(key, cached);
      return cached;
    },
  };
}
