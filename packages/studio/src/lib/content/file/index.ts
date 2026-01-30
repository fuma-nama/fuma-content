import type { StudioDocument } from "..";
import fs from "node:fs/promises";
import type { FileSystemCollection } from "fuma-content/collections/fs";
import path from "node:path";

export interface FileStudioDocument extends StudioDocument {
  isFile: true;
  filePath: string;

  read: () => Promise<string | undefined>;
  write: (content: string) => Promise<void>;
}

export function fileDocument(file: string, name = file): FileStudioDocument {
  return {
    id: encodeId(file),
    isFile: true,
    filePath: file,
    name,
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
