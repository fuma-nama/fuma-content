import type { Loader, LoaderInput } from "@/plugins/loader";
import { load } from "js-yaml";
import { z } from "zod";
import { validate } from "@/utils/validation";
import { MetaCollection, type MetaTransformationContext } from "@/collections/meta";
import type { DynamicCore } from "@/dynamic";

const querySchema = z
  .object({
    collection: z.string().optional(),
    workspace: z.string().optional(),
  })
  .loose();

/**
 * load meta files, fallback to bundler's built-in plugins when ?collection is unspecified.
 */
export function createMetaLoader(
  { getCore }: DynamicCore,
  resolve: {
    json?: "json" | "js";
  } = {},
): Loader {
  const { json: resolveJson = "js" } = resolve;

  function parse(filePath: string, source: string) {
    try {
      if (filePath.endsWith(".json")) return JSON.parse(source);
      if (filePath.endsWith(".yaml")) return load(source);
    } catch (e) {
      throw new Error(`invalid data in ${filePath}`, { cause: e });
    }

    throw new Error(`Unknown file type ${filePath}`);
  }

  function onMeta(source: string, { filePath, query }: LoaderInput) {
    const parsed = querySchema.safeParse(query);
    if (!parsed.success || !parsed.data.collection) return null;
    const { collection: collectionName, workspace } = parsed.data;

    return async (): Promise<unknown> => {
      let core = await getCore();
      if (workspace) {
        core = core.getWorkspaces().get(workspace) ?? core;
      }

      let collection = core.getCollection(collectionName);
      let data: unknown = parse(filePath, source);
      if (!collection || !(collection instanceof MetaCollection)) return data;

      const context: MetaTransformationContext = {
        path: filePath,
        source,
      };

      if (collection.schema) {
        data = await validate(collection.schema, data, context, `invalid data in ${filePath}`);
      }

      return collection.onLoad.run(data, context);
    };
  }

  return {
    async load(input) {
      const result = onMeta(await input.getSource(), input);
      if (result === null) return null;
      const data = await result();

      if (input.filePath.endsWith(".json")) {
        return {
          code:
            resolveJson === "json"
              ? JSON.stringify(data)
              : `export default ${JSON.stringify(data)}`,
          moduleType: resolveJson,
        };
      } else {
        return {
          code: `export default ${JSON.stringify(data)}`,
        };
      }
    },
    bun: {
      load(source, input) {
        const result = onMeta(source, input);
        if (result === null)
          return {
            loader: "object",
            exports: parse(input.filePath, source),
          };

        return result().then((data) => ({
          loader: "object",
          exports: { default: data },
        }));
      },
    },
  };
}
