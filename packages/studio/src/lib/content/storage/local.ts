import { FileSystemCollection } from "fuma-content/collections/fs";
import { CollectionStorage, StorageAdapter, StorageEntry } from ".";
import fs from "node:fs/promises";

export interface FileCollectionEntry extends StorageEntry {
  read: () => Promise<string>;
  update: (content: string) => Promise<void>;
}

export function localAdapter(): StorageAdapter {
  return {
    createStorage(collection) {
      if (collection instanceof FileSystemCollection) {
        return localFileStorage(collection);
      }
    },
  };
}

function localFileStorage(
  collection: FileSystemCollection,
): CollectionStorage<FileCollectionEntry> {
  function entry(file: string): FileCollectionEntry {
    return {
      id: file,
      name: file,
      async read() {
        return (await fs.readFile(file)).toString();
      },
      async update(content) {
        await fs.writeFile(file, content);
      },
      async delete() {
        await fs.rm(file, { force: true });
      },
    };
  }

  return {
    async list() {
      collection.invalidateCache();
      const files = await collection.getFiles();
      return files.map(entry);
    },
  };
}
