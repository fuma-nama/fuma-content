import path from "node:path";
import { Awaitable, StudioDocument, StudioHook } from "..";
import { fileDocument, FileStudioDocument } from "../file";
import { DataCollection } from "fuma-content/collections/data";
import fs from "node:fs/promises";
import { getJSONSchema } from "fuma-content";
import { dump, load } from "js-yaml";

export interface DataStudioDocument extends FileStudioDocument, EncoderDecoder {
  isData: true;
}

interface EncoderDecoder {
  encode: (data: unknown) => Awaitable<string>;
  decode: (content: string) => Awaitable<unknown>;
}

export function isDataDocument(doc: StudioDocument): doc is DataStudioDocument {
  return "isData" in doc && doc.isData === true;
}

export const encoderDecoders = {
  json: {
    encode(data) {
      return JSON.stringify(data, null, 2);
    },
    decode(content) {
      return JSON.parse(content);
    },
  },
  yaml: {
    encode(data) {
      return dump(data);
    },
    decode(content) {
      return load(content);
    },
  },
} satisfies Record<string, EncoderDecoder>;

export function getEncoderDecoder(
  format: keyof typeof encoderDecoders | (string & {}),
): EncoderDecoder {
  return encoderDecoders[format as never] ?? encoderDecoders.json;
}

export function dataDocument(
  collection: DataCollection,
  file: string,
  name?: string,
): DataStudioDocument {
  return {
    isData: true,
    ...getEncoderDecoder(path.extname(file).slice(1)),
    ...fileDocument(collection, file, name),
  };
}

export function dataHook(collection: DataCollection): StudioHook<DataStudioDocument> {
  return {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        return dataDocument(collection, path.join(collection.dir, file));
      });
    },
    async getDocument(id) {
      const docs = await this.getDocuments();
      return docs.find((doc) => doc.id === id);
    },
    toItem() {
      return {
        id: collection.name,
        name: collection.name,
        supportStudio: true,
        badge: "Data",
        _data: {
          formats: collection.supportedFileFormats ?? ["json", "yaml"],
        },
      };
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
