import { MDXCollection } from "fuma-content/collections/mdx";
import { StudioDocument, StudioHook } from "..";
import { fileDocument, FileStudioDocument } from "../file";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import { getJSONSchema } from "fuma-content";
import * as Y from "yjs";
import { slateNodesToInsertDelta, yTextToSlateElement } from "@slate-yjs/core";
import type { SlateEditor } from "platejs";

export interface MDXStudioDocument extends FileStudioDocument {
  isMDX: true;
}

export function isMDXDocument(doc: StudioDocument): doc is MDXStudioDocument {
  return "isMDX" in doc && doc.isMDX === true;
}

export function mdxDocument(
  collection: MDXCollection,
  file: string,
  name?: string,
): MDXStudioDocument {
  return {
    isMDX: true,
    ...fileDocument(collection, file, name),
  };
}

let editor: Promise<SlateEditor> | null = null;

async function getEditor(): Promise<SlateEditor> {
  editor ??= (async () => {
    const { createSlateEditor } = await import("platejs");
    const { MarkdownKit } = await import("@/components/editor/plugins/markdown-kit");

    return createSlateEditor({
      plugins: MarkdownKit,
    });
  })();
  return editor;
}

export function mdxHook(collection: MDXCollection): StudioHook<MDXStudioDocument> {
  const hook: StudioHook<MDXStudioDocument> = {
    async getDocuments() {
      collection.invalidateCache();
      const files = await collection.getFiles();

      return files.map((file) => {
        return mdxDocument(collection, path.join(collection.dir, file));
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
    toItem() {
      return { id: collection.name, name: collection.name, supportStudio: true, badge: "MDX" };
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
    hocuspocus: {
      async loadDocument(_payload, { documentId }) {
        const doc = await hook.getDocument(documentId);
        if (!doc) return;
        const content = await doc.read();
        if (content === undefined) return;

        const ydoc = new Y.Doc();
        const editor = await getEditor();
        const { MarkdownPlugin } = await import("@platejs/markdown");
        const value = editor.getPlugin(MarkdownPlugin).api.markdown.deserialize(content);
        ydoc
          .get("content", Y.XmlText)
          .applyDelta(slateNodesToInsertDelta(value), { sanitize: false });
        return ydoc;
      },
      async storeDocument(payload, { documentId }) {
        const doc = await hook.getDocument(documentId);
        if (!doc) return;

        const text = payload.document.get("content", Y.XmlText);
        const element = yTextToSlateElement(text);
        const editor = await getEditor();
        const { MarkdownPlugin } = await import("@platejs/markdown");
        await doc.write(
          editor
            .getPlugin(MarkdownPlugin)
            .api.markdown.serialize({ value: element.children as never }),
        );
      },
    },
  };

  return hook;
}
