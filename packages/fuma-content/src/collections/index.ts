import type { WorkspaceConfig } from "@/config";
import type { JSONSchemaHandler } from "@/plugins/json-schema";
import type { FIleCollectionHandler } from "@/collections/handlers/fs";
import type { MDXCollectionHandler } from "@/collections/mdx";
import type { MetaCollectionHandler } from "@/collections/meta";
import type { EntryFileHandler } from "@/plugins/entry-file";
import type { LastModifiedHandler } from "@/plugins/last-modified";

export interface InitOptions {
  name: string;
  workspace?: WorkspaceConfig;
}

export interface Collection {
  name: string;
  init?: (options: InitOptions) => void;

  readonly handlers: CollectionHandlers;
}

export interface CollectionHandlers {
  fs?: FIleCollectionHandler;
  mdx?: MDXCollectionHandler;
  meta?: MetaCollectionHandler;
  "json-schema"?: JSONSchemaHandler;
  "entry-file"?: EntryFileHandler;
  "last-modified"?: LastModifiedHandler;
}

export function createCollection(
  init: (collection: Collection, options: InitOptions) => void,
): Collection {
  return {
    name: "",
    handlers: {},
    init(options) {
      this.name = options.name;
      init(this, options);
    },
  };
}
