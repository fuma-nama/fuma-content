import path from "node:path";
import { Awaitable, StudioDocument, StudioHook } from "..";
import { fileDocument, FileStudioDocument } from "../file";
import { DataCollection } from "fuma-content/collections/data";
import fs from "node:fs/promises";
import { getJSONSchema } from "fuma-content";

export interface DataStudioDocument extends FileStudioDocument {
  isData: true;
  encode: (data: unknown) => Awaitable<string>;
  decode: (content: string) => Awaitable<string>;
}

export function isDataDocument(doc: StudioDocument): doc is DataStudioDocument {
  return "isData" in doc && doc.isData === true;
}

export function dataDocument(file: string, name?: string): DataStudioDocument {
  return {
    isData: true,
    encode(data) {
      return JSON.stringify(data, null, 2);
    },
    decode(content) {
      return JSON.parse(content);
    },
    ...fileDocument(file, name),
  };
}

export function dataHook(collection: DataCollection): StudioHook<DataStudioDocument> {
  return {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        const filePath = path.join(collection.dir, file);

        return dataDocument(filePath, file);
      });
    },
    async getDocument(id) {
      const docs = await this.getDocuments();
      return docs.find((doc) => doc.id === id);
    },
    pages: {
      async edit({ document }) {
        const { DataDocEdit } = await import("./client");
        const content = (await document.read()) ?? "";

        const jsonSchema = collection.schema
          ? JSON.parse(JSON.stringify(getJSONSchema(collection.schema)))
          : undefined;
        return (
          <DataDocEdit
            key={document.id}
            documentId={document.id}
            collectionId={collection.name}
            jsonSchema={jsonSchema}
            data={await document.decode(content)}
          />
        );
      },
    },
    async client() {
      const { clientContext } = await import("./client");
      return clientContext;
    },
    actions: {
      async deleteDocument(options) {
        try {
          await fs.rm(options.document.filePath);
        } catch {
          // ignore
        }
      },
    },
  };
}
