export interface AsyncCache<V> {
  cached: (key: string, fn: () => V | Promise<V>) => V | Promise<V>;
  $value: <T>() => AsyncCache<T>;
  invalidate: (key: string) => void;
}

/**
 * cache for async resources, finished promises will be resolved into original value, otherwise wrapped with a promise.
 */
export function createCache<V>(store = new Map<string, V | Promise<V>>()): AsyncCache<V> {
  return {
    cached(key, fn) {
      let cached = store.get(key);
      if (cached) return cached;

      cached = fn();
      if (cached instanceof Promise) {
        cached = cached.then((out) => {
          // replace with resolved if still exists
          if (store.has(key)) {
            store.set(key, out);
          }

          return out;
        });
      }
      store.set(key, cached);
      return cached;
    },
    invalidate(key) {
      store.delete(key);
    },
    $value<T>() {
      return this as unknown as AsyncCache<T>;
    },
  };
}
