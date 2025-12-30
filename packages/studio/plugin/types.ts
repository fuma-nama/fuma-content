import type { Collection } from "fuma-content/collections";
import type { FC } from "react";

type Awaitable<T> = T | Promise<T>;

export interface StudioDocument {
  id: string;
  name: string;
}

export interface MDXStudioDocument extends StudioDocument {
  type: "mdx";
  filePath: string;
}

export interface StudioHandler<Doc extends StudioDocument> {
  getDocuments: () => Awaitable<Doc[]>;
  getDocument: (id: string) => Awaitable<Doc | undefined>;

  pages?: {
    create?: FC<{ collection: Collection }>;
    edit?: FC<{ document: Doc; collection: Collection }>;
  };

  actions?: {
    deleteDocument?: (options: { collection: Collection; document: Doc }) => Awaitable<void>;
  };
}
