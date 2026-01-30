import { studioHook, type StudioDocument } from "..";
import fs from "node:fs/promises";
import type { FileSystemCollection } from "fuma-content/collections/fs";
import path from "node:path";

export interface FileStudioDocument extends StudioDocument {
  isFile: true;
  filePath: string;

  read: () => Promise<string | undefined>;
  write: (content: string) => Promise<void>;
}

export function fileDocument(
  collection: FileSystemCollection,
  fullPath: string,
  name?: string,
): FileStudioDocument {
  const relativePath = path.relative(collection.dir, fullPath);
  return {
    id: encodeId(relativePath),
    isFile: true,
    filePath: fullPath,
    name: name ?? relativePath,
    toItem({ collectionId }) {
      return {
        id: this.id,
        name: this.name,
        permissions: {
          delete: collection.pluginHook(studioHook).actions?.deleteDocument !== undefined,
        },
        collectionId,
      };
    },
    async read() {
      try {
        return (await fs.readFile(this.filePath)).toString();
      } catch {
        return;
      }
    },
    async write(content) {
      await fs.writeFile(this.filePath, content);
    },
  };
}

export function isFileDocument(doc: StudioDocument): doc is FileStudioDocument {
  return "isFile" in doc && doc.isFile === true;
}

export function encodeId(file: string) {
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
  return {
    fullPath: filePath,
    relativePath: path.relative(collection.dir, filePath),
  };
}
