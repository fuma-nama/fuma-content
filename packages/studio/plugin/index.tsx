import { getJSONSchema, type Plugin } from "fuma-content";
import "fuma-content/collections";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import type { MDXStudioDocument, StudioHandler } from "./types";
import type { Collection } from "fuma-content/collections";

declare module "fuma-content/collections" {
  export interface CollectionHandlers {
    studio?: StudioHandler<any>;
  }
}

export function studio(): Plugin {
  return {
    name: "studio",
    collection(collection) {
      // mdx collection
      collection.handlers.studio ??= mdx(collection);
    },
  };
}

function mdx(collection: Collection): StudioHandler<MDXStudioDocument> | undefined {
  const { mdx: mdxHandler, fs: fsHandler } = collection.handlers;
  if (!mdxHandler || !fsHandler) return;

  async function read(doc: MDXStudioDocument) {
    try {
      return (await fs.readFile(doc.filePath)).toString();
    } catch {
      return;
    }
  }

  return {
    async getDocuments() {
      const files = await fsHandler.getFiles();

      return files.map((file) => {
        const filePath = path.join(fsHandler.dir, file);

        return {
          type: "mdx",
          id: file,
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
      async edit({ document, collection }) {
        const { MDXEditorWithForm } = await import("./mdx-editor");
        const parsed = grayMatter((await read(document)) ?? "");

        const jsonSchema = mdxHandler.frontmatterSchema
          ? JSON.parse(JSON.stringify(getJSONSchema(mdxHandler.frontmatterSchema)))
          : undefined;
        return (
          <MDXEditorWithForm
            documentId={document.id}
            collectionId={collection.name}
            jsonSchema={jsonSchema}
            frontmatter={parsed.data}
            content={parsed.content}
          />
        );
      },
    },
  };
}

export * from "./types";
