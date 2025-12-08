import type { EmitEntry, Plugin } from "@/core";
import fs from "node:fs/promises";
import path from "node:path";
import type { Collection } from "@/collections";

export interface JSONSchemaOptions {
  /**
   * insert `$schema` field to JSON files on creation.
   *
   * @defaultValue false
   */
  insert?: boolean;
}

export interface JSONSchemaHandler {
  create: () => object | undefined | Promise<object | undefined>;
}

/**
 * Generate JSON schemas locally for collection schemas
 *
 * note: **it only works with Zod**
 */
export default function jsonSchema({
  insert = false,
}: JSONSchemaOptions = {}): Plugin {
  function getSchemaPath(name: string) {
    return `json-schema/${name}.json`;
  }

  return {
    name: "json-schema",
    configureServer(server) {
      const { outDir } = this.core.getOptions();
      if (!server.watcher || !insert) return;

      server.watcher.on("add", async (file) => {
        let match: Collection | undefined;
        for (const collection of this.core.getCollections()) {
          const handler = collection.handlers.fs;
          if (!handler) return;

          if (handler.hasFile(file)) {
            match = collection;
            break;
          }
        }

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
    async emit() {
      const files: EmitEntry[] = [];

      for (const collection of this.core.getCollections()) {
        const handler = collection.handlers["json-schema"];
        if (!handler) continue;

        const jsonSchema = await handler.create();
        if (!jsonSchema) continue;
        files.push({
          path: getSchemaPath(collection.name),
          content: JSON.stringify(jsonSchema, null, 2),
        });
      }

      return files;
    },
  };
}
