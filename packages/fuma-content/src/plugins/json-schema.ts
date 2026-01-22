import { defineCollectionHook } from "@/collections";
import { FileSystemCollection } from "@/collections/fs";
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

  /**
   * create JSON schema
   */
  create?: () => Awaitable<object | undefined>;
}

export interface JSONSchemaHook {
  getSchemaPath: () => string;
  create?: () => Awaitable<object | undefined>;
}

/**
 * Generate JSON schemas locally for collection schemas.
 */
export const jsonSchemaHook = defineCollectionHook<JSONSchemaHook, JSONSchemaOptions>(
  (collection, { insert = false, create }) => {
    const hook: JSONSchemaHook = {
      create,
      getSchemaPath() {
        return `json-schema/${collection.name}.json`;
      },
    };

    collection.onServer.hook(({ core, server }) => {
      const { outDir } = core.getOptions();
      if (!server.watcher || !insert || !(collection instanceof FileSystemCollection)) return;

      server.watcher.on("add", async (file) => {
        if (!collection.hasFile(file) || !file.endsWith(".json")) return;

        let obj: object;
        try {
          const content = (await fs.readFile(file)).toString();
          obj = content.length > 0 ? JSON.parse(content) : {};
        } catch {
          return;
        }

        if ("$schema" in obj) return;
        const schemaPath = path.join(outDir, hook.getSchemaPath());
        const updated = {
          $schema: path.relative(path.dirname(file), schemaPath),
          ...obj,
        };

        await fs.writeFile(file, JSON.stringify(updated, null, 2));
      });
    });
    collection.onEmit.pipe(async (entries) => {
      const jsonSchema = await hook.create?.();
      if (!jsonSchema) return entries;
      entries.push({
        path: hook.getSchemaPath(),
        content: JSON.stringify(jsonSchema, null, 2),
      });
      return entries;
    });
    return hook;
  },
);
