import { MDXCollection } from "fuma-content/collections/mdx";
import { StudioHook } from "..";
import { FileStudioDocument } from "../file";
import fs from "node:fs/promises";
import path from "node:path";
import grayMatter from "gray-matter";
import { getJSONSchema } from "fuma-content";
import * as Y from "yjs";
import { slateNodesToInsertDelta, yTextToSlateElement } from "@slate-yjs/core";
import type { SlateEditor } from "platejs";
import { applyJsonObject } from "mutative-yjs";

export class MDXStudioDocument extends FileStudioDocument {
  constructor(
    readonly collection: MDXCollection,
    readonly filePath: string,
    name?: string,
  ) {
    super(collection, filePath, name);
  }

  async readParsed() {
    const content = await this.read();
    if (content === undefined) return;

    return grayMatter({ content });
  }

  async updateParsed(frontmatter?: unknown, content?: string) {
    if (frontmatter != null && content != null) {
      await this.write(grayMatter.stringify({ content }, frontmatter));
      return;
    }

    if (frontmatter == null && content == null) {
      return;
    }

    const parsed = await this.readParsed();
    if (parsed) {
      await this.write(
        grayMatter.stringify({ content: content ?? parsed.content }, frontmatter ?? parsed.data),
      );
      return;
    }

    content ??= "";
    await this.write(frontmatter ? grayMatter.stringify({ content }, frontmatter) : content);
  }
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
        return new MDXStudioDocument(collection, path.join(collection.dir, file));
      });
    },
    async getDocument(id) {
      const docs = await this.getDocuments();
      return docs.find((doc) => doc.id === id);
    },
    pages: {
      async edit({ document }) {
        const { MDXDocUpdateEditor } = await import("./client");

        const jsonSchema = collection.frontmatterSchema
          ? JSON.parse(JSON.stringify(getJSONSchema(collection.frontmatterSchema)))
          : undefined;
        return (
          <MDXDocUpdateEditor
            key={document.id}
            documentId={document.id}
            collectionId={collection.name}
            jsonSchema={jsonSchema}
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
      async loadDocument(payload, { documentId }) {
        const doc = await hook.getDocument(documentId);
        if (!doc) return;

        const parsed = await doc.readParsed();
        if (parsed === undefined) return;

        const ydoc = payload.document;
        const editor = await getEditor();
        const { MarkdownPlugin } = await import("@platejs/markdown");

        applyJsonObject(ydoc.getMap("frontmatter"), parsed.data);
        const ycontent = ydoc.get("content", Y.XmlText);
        ycontent.applyDelta(
          slateNodesToInsertDelta(
            editor.getPlugin(MarkdownPlugin).api.markdown.deserialize(parsed.content),
          ),
          { sanitize: false },
        );
        return ydoc;
      },
      async storeDocument(payload, { documentId }) {
        const doc = await hook.getDocument(documentId);
        if (!doc) return;
        let frontmatter: unknown | undefined;
        let content: string | undefined;

        if (!payload.document.isEmpty("frontmatter")) {
          try {
            const data = payload.document.getMap("frontmatter").toJSON();
            const schema = doc.collection.frontmatterSchema;
            if (schema) {
              const result = await schema["~standard"].validate(data);
              if (result.issues) throw new Error("invalid frontmatter value");
            }

            frontmatter = data;
          } catch {}
        }

        if (!payload.document.isEmpty("content")) {
          const text = payload.document.get("content", Y.XmlText);
          const element = yTextToSlateElement(text);
          const editor = await getEditor();

          const { MarkdownPlugin } = await import("@platejs/markdown");
          content = editor
            .getPlugin(MarkdownPlugin)
            .api.markdown.serialize({ value: element.children as never });
        }

        await doc.updateParsed(frontmatter, content);
      },
    },
  };

  return hook;
}
