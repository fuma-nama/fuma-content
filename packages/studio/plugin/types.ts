import type { FC } from "react";

export interface StudioDocument {
  id: string;
  name: string;
}

export interface StudioHandler {
  getDocuments: () => Promise<StudioDocument[]>;
  getDocument: (id: string) => Promise<StudioDocument | undefined>;

  pages?: {
    edit?: FC<{ document: StudioDocument }>;
  };
}
