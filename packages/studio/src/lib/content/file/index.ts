import { studioHook, type StudioDocument } from "..";
import fs from "node:fs/promises";
import type { FileSystemCollection } from "fuma-content/collections/fs";
import path from "node:path";

export class FileStudioDocument implements StudioDocument {
  id: string;
  name: string;

  toItem({ collectionId }: { collectionId: string }) {
    return {
      id: this.id,
      name: this.name,
      permissions: {
        delete: this.collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
      },
      collectionId,
    };
  }

  async read() {
    try {
      return (await fs.readFile(this.filePath)).toString();
    } catch {
      return;
    }
  }

  async write(content: string) {
    await fs.writeFile(this.filePath, content);
  }

  constructor(
    readonly collection: FileSystemCollection,
    readonly filePath: string,
    name?: string,
  ) {
    const relativePath = path.relative(collection.dir, filePath);
    this.id = encodeId(relativePath);
    this.name = name ?? relativePath;
  }
}

function encodeId(file: string) {
  return file.replaceAll("/", "--");
}

export async function createFileDocument(
  collection: FileSystemCollection,
  name: string,
  content: string,
) {
  const filePath = path.join(collection.dir, name);

  if (!collection.hasFile(filePath)) {
    throw new Error(`invalid collection name: ${name}`);
  }

  const exists = await fs
    .access(filePath, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    throw new Error(`document ${name} already exists`);
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  const relativePath = path.relative(collection.dir, filePath);
  return {
    id: encodeId(relativePath),
    fullPath: filePath,
    relativePath,
  };
}
