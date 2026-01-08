import type { JSONSchemaHandler } from "@/plugins/json-schema";
import type { FIleCollectionHandler } from "@/collections/handlers/fs";
import type { MDXCollectionHandler } from "@/collections/mdx";
import type { MetaCollectionHandler } from "@/collections/meta";
import type { VersionControlHandler } from "@/plugins/git";
import type { Core, PluginOption } from "@/core";

export interface InitOptions {
  name: string;
  core: Core;
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
  "version-control"?: VersionControlHandler;
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
