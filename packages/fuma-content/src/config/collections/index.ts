import type { WorkspaceConfig } from "@/config/define";
import type { JSONSchemaHandler } from "@/plugins/json-schema";
import type { FIleCollectionHandler } from "@/config/collections/fs";
import type { MDXCollectionHandler } from "@/config/collections/mdx";
import type { MetaCollectionHandler } from "@/config/collections/meta";
import type { EntryFileHandler } from "@/plugins/entry-file";

export interface InitOptions {
  name: string;
  workspace?: WorkspaceConfig;
}

export interface Collection {
  name: string;
  init?: (options: InitOptions) => void;

  handlers: {
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
