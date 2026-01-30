import { MDXCollection } from "fuma-content/collections/mdx";
import { StudioDocument, StudioHook } from "..";
import { fileDocument, FileStudioDocument } from "../file";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import { getJSONSchema } from "fuma-content";

export interface MDXStudioDocument extends FileStudioDocument {
  isMDX: true;
}

export function isMDXDocument(doc: StudioDocument): doc is MDXStudioDocument {
  return "isMDX" in doc && doc.isMDX === true;
}

export function mdxDocument(file: string, name?: string): MDXStudioDocument {
  return {
    isMDX: true,
    ...fileDocument(file, name),
  };
}

export function mdxHook(collection: MDXCollection): StudioHook<MDXStudioDocument> {
  return {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        const filePath = path.join(collection.dir, file);

        return mdxDocument(filePath, file);
      });
    },
    async getDocument(id) {
      const docs = await this.getDocuments();
      return docs.find((doc) => doc.id === id);
    },
    pages: {
      async edit({ document }) {
        const { MDXDocUpdateEditor } = await import("./client");
        const parsed = grayMatter((await document.read()) ?? "");

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
