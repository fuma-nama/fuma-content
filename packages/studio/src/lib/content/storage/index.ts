import { Collection } from "fuma-content/collections";
import type { Awaitable } from "..";

export interface CollectionStorage<Entry extends StorageEntry> {
  list: () => Awaitable<Entry[]>;
}

export interface StorageAdapter {
  createStorage: (collection: Collection) => CollectionStorage<StorageEntry> | undefined;
}

export interface StorageEntry {
  id: string;
  name: string;
  delete: () => Promise<void>;
}
