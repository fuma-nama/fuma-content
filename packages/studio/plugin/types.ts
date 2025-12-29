import type { Collection } from "fuma-content/collections";
import type { FC } from "react";

export interface StudioDocument {
  id: string;
  name: string;

  getValue: () => Promise<unknown>;
  setValue: (value: unknown) => Promise<void>;
}

export interface StudioHandler {
  getDocuments: () => Promise<StudioDocument[]>;
  getDocument: (id: string) => Promise<StudioDocument | undefined>;

  pages?: {
    edit?: FC<{ document: StudioDocument; collection: Collection }>;
    docuemntOptions?: FC<{ document: StudioDocument; collection: Collection }>;
  };
}
