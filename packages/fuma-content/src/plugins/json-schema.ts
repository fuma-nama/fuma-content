import { defineCollectionHook } from "@/collections";
import type { Plugin } from "@/core";
import { Awaitable } from "@/types";
import fs from "node:fs/promises";
import path from "node:path";

export interface JSONSchemaOptions {
  /**
   * insert `$schema` field to JSON files on creation.
   *
   * @defaultValue false
   */
  insert?: boolean;
}

export interface JSONSchemaHook {
  schemaPath?: string;
  create?: () => Awaitable<object | undefined>;
}

export const jsonSchemaHook = defineCollectionHook<JSONSchemaHook>((collection) => {
  const hook: JSONSchemaHook = {};
  function getSchemaPath(name: string) {
    return `json-schema/${name}.json`;
  }

  collection.onEmit.pipe(async (entries) => {
    const jsonSchema = await hook.create?.();
    if (!jsonSchema) return entries;
    entries.push({
      path: hook.schemaPath ?? getSchemaPath(collection.name),
      content: JSON.stringify(jsonSchema, null, 2),
    });
    return entries;
  });
  return hook;
});

/**
 * Generate JSON schemas locally for collection schemas
 *
 * Requires the `json-schema` handler to be implemented.
 */
export default function jsonSchema({ insert = false }: JSONSchemaOptions = {}): Plugin {
  function getSchemaPath(name: string) {
    return `json-schema/${name}.json`;
  }

  return {
    name: "json-schema",
    configureServer(server) {
      const { outDir } = this.core.getOptions();
      if (!server.watcher || !insert) return;

      server.watcher.on("add", async (file) => {
        const match = this.core.getCollections().find((collection) => {
          const handler = getHandler<FileCollectionHandler>(collection, "storage");
          if (!handler) return false;
          return handler.hasFile(file);
        });

        if (!match) return;
        let obj: object;
        try {
          const content = (await fs.readFile(file)).toString();
          obj = content.length > 0 ? JSON.parse(content) : {};
        } catch {
          return;
        }

        if ("$schema" in obj) return;
        const schemaPath = path.join(
          outDir,
          getSchemaPath(parent ? `${parent.name}.meta` : match.name),
        );
        const updated = {
          $schema: path.relative(path.dirname(file), schemaPath),
          ...obj,
        };

        await fs.writeFile(file, JSON.stringify(updated, null, 2));
      });
    },
    async emit() {},
  };
}
