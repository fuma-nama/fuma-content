import { getJSONSchema, type Plugin } from "fuma-content";
import "fuma-content/collections";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import type { StudioHandler } from "./types";

declare module "fuma-content/collections" {
  export interface CollectionHandlers {
    studio: StudioHandler;
  }
}

export function studio(): Plugin {
  return {
    name: "studio",
    collection(collection) {
      const { fs: fsHandler, mdx } = collection.handlers;

      // mdx collection
      if (fsHandler && mdx) {
        collection.handlers.studio ??= {
          async getDocuments() {
            const files = await fsHandler.getFiles();

            return files.map((file) => {
              const filePath = path.join(fsHandler.dir, file);

              return {
                id: file,
                name: file,
                async getValue() {
                  try {
                    return (await fs.readFile(filePath)).toString();
                  } catch {
                    return;
                  }
                },
                async setValue(value) {
                  await fs.writeFile(filePath, value as string);
                },
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
              const parsed = grayMatter((await document.getValue()) as string);

              const jsonSchema = mdx.frontmatterSchema
                ? JSON.parse(JSON.stringify(getJSONSchema(mdx.frontmatterSchema)))
                : undefined;
              return (
                <MDXEditorWithForm
                  id={document.id}
                  collection={collection.name}
                  jsonSchema={jsonSchema}
                  frontmatter={parsed.data as Record<string, unknown>}
                  content={parsed.content}
                />
              );
            },
          },
        };
      }
    },
  };
}

export * from "./types";
