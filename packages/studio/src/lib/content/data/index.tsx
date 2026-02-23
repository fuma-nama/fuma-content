import path from "node:path";
import { Awaitable, StudioDocument, StudioHook } from "..";
import { FileStudioDocument } from "../file";
import { DataCollection } from "fuma-content/collections/data";
import fs from "node:fs/promises";
import { getJSONSchema } from "fuma-content";
import { dump, load } from "js-yaml";

export class DataStudioDocument extends FileStudioDocument {
  readonly encoderDecoder: EncoderDecoder;

  constructor(collection: DataCollection, file: string, name?: string) {
    super(collection, file, name);
    this.encoderDecoder = getEncoderDecoder(path.extname(file).slice(1));
  }
}

interface EncoderDecoder {
  encode: (data: unknown) => Awaitable<string>;
  decode: (content: string) => Awaitable<unknown>;
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

export function dataHook(collection: DataCollection): StudioHook<DataStudioDocument> {
  return {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        return new DataStudioDocument(collection, path.join(collection.dir, file));
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

        const jsonSchema = collection.schema
          ? JSON.parse(JSON.stringify(getJSONSchema(collection.schema)))
          : undefined;
        return (
          <DataDocEdit
            key={document.id}
            documentId={document.id}
            collectionId={collection.name}
            jsonSchema={jsonSchema}
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
