import type { WorkspaceConfig } from "@/config";
import type { JSONSchemaHandler } from "@/plugins/json-schema";
import type { FIleCollectionHandler } from "@/collections/file-list";
import type { MDXCollectionHandler } from "@/collections/mdx";
import type { MetaCollectionHandler } from "@/collections/meta";
import type { EntryFileHandler } from "@/plugins/entry-file";

export interface InitOptions {
  name: string;
  workspace?: WorkspaceConfig;
}

export interface Collection {
  name: string;
  init?: (options: InitOptions) => void;

  readonly handlers: {
    fs?: FIleCollectionHandler;
    mdx?: MDXCollectionHandler;
    meta?: MetaCollectionHandler;
    "json-schema"?: JSONSchemaHandler;
    "entry-file"?: EntryFileHandler;
  };
}

export function createCollection({
  init,
}: {
  init: (this: Collection, options: InitOptions) => void;
}): Collection {
  return {
    name: "",
    handlers: {},
    init(options) {
      this.name = options.name;
      init.call(this, options);
    },
  };
}
