import type { WorkspaceConfig } from "@/config";
import type { JSONSchemaHandler } from "@/plugins/json-schema";
import type { FIleCollectionHandler } from "@/collections/handlers/fs";
import type { MDXCollectionHandler } from "@/collections/mdx";
import type { MetaCollectionHandler } from "@/collections/meta";
import type { LastModifiedHandler } from "@/plugins/last-modified";
import type { PluginOption } from "@/core";

export interface InitOptions {
  name: string;
  workspace?: WorkspaceConfig;
}

export interface Collection {
  name: string;
  init?: (options: InitOptions) => void;

  readonly handlers: CollectionHandlers;

  /**
   * information for the collection type, can be shared for all collections of same type.
   */
  readonly typeInfo: CollectionTypeInfo;
}

export interface CollectionTypeInfo {
  /**
   * ID for collection type.
   *
   * @example `my-package:my-collection-type`
   */
  readonly id: string;

  /**
   * plugins to register, registered once for each collection type.
   */
  readonly plugins?: PluginOption;
}

export interface CollectionHandlers {
  fs?: FIleCollectionHandler;
  mdx?: MDXCollectionHandler;
  meta?: MetaCollectionHandler;
  "json-schema"?: JSONSchemaHandler;
  "last-modified"?: LastModifiedHandler;
}

export function createCollection(
  info: CollectionTypeInfo,
  init: (collection: Collection, options: InitOptions) => void,
): Collection {
  return {
    name: "",
    handlers: {},
    init(options) {
      this.name = options.name;
      init(this, options);
    },
    typeInfo: info,
  };
}
