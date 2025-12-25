import type { Plugin } from "fuma-content";
import "fuma-content/collections";
import fs from "node:fs/promises";
import path from "node:path";
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

            return files.map((file) => ({
              id: file,
              name: file,
            }));
          },
          async getDocument(id) {
            return {
              id,
              name: id,
            };
          },
          pages: {
            async edit({ document }) {
              const { MDXEditor } = await import("@/components/editor/md");
              const content = await fs.readFile(path.join(fsHandler.dir, document.id));

              return <MDXEditor defaultValue={content.toString()} />;
            },
          },
        };
      }
    },
  };
}

export * from "./types";
