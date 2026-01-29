import { getJSONSchema } from "fuma-content";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import { defineCollectionHook, type Collection } from "fuma-content/collections";
import type { FC } from "react";
import type { DocumentItem } from "@/lib/data/store";
import { MDXCollection } from "fuma-content/collections/mdx";

type Awaitable<T> = T | Promise<T>;

export interface StudioDocument {
  id: string;
  name: string;
}

export interface MDXStudioDocument extends StudioDocument {
  type: "mdx";
  filePath: string;
}

export interface CreateDocumentDialogContext {
  collectionId: string;
  useDialog: () => {
    open: boolean;
    setOpen: (v: boolean) => void;
    onCreate: (item: DocumentItem) => void;
  };
}

export interface StudioHook<Doc extends StudioDocument = StudioDocument> {
  disabled?: boolean;
  init?: () => Awaitable<void>;
  getDocuments: () => Awaitable<Doc[]>;
  getDocument: (id: string) => Awaitable<Doc | undefined>;

  pages?: {
    edit?: FC<{ document: Doc; collection: Collection }>;
  };

  /**
   * the properties inside should be exported from a file with "use client".
   */
  client?: () => Awaitable<ClientContext>;

  actions?: {
    deleteDocument?: (options: { collection: Collection; document: Doc }) => Awaitable<void>;
  };
}

export interface ClientContext {
  dialogs?: {
    createDocument?: FC<CreateDocumentDialogContext>;
  };
}

export const studioHook = defineCollectionHook<StudioHook, StudioHook | undefined>(
  (collection, options) => {
    if (options) return options;
    if (collection instanceof MDXCollection) return mdx(collection) as unknown as StudioHook;

    return {
      disabled: true,
      getDocuments() {
        return [];
      },
      getDocument() {
        return undefined;
      },
    };
  },
);

function mdx(collection: MDXCollection): StudioHook<MDXStudioDocument> {
  async function read(doc: MDXStudioDocument) {
    try {
      return (await fs.readFile(doc.filePath)).toString();
    } catch {
      return;
    }
  }

  function encodeId(file: string) {
    return file.replaceAll(/\(|\)|\//g, "--");
  }

  return {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        const filePath = path.join(collection.dir, file);

        return {
          type: "mdx",
          id: encodeId(file),
          name: file,
          filePath,
        };
      });
    },
    async getDocument(id) {
      const docs = await this.getDocuments();
      return docs.find((doc) => doc.id === id);
    },
    pages: {
      async edit({ document }) {
        const { MDXDocUpdateEditor } = await import("./mdx/client");
        const parsed = grayMatter((await read(document)) ?? "");

        const jsonSchema = collection.frontmatterSchema
          ? JSON.parse(JSON.stringify(getJSONSchema(collection.frontmatterSchema)))
          : undefined;
        return (
          <MDXDocUpdateEditor
            key={document.id}
            documentId={document.id}
            collectionId={collection.name}
            jsonSchema={jsonSchema}
            frontmatter={parsed.data}
            content={parsed.content}
          />
        );
      },
    },
    async client() {
      const { clientContext } = await import("./mdx/client");
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
