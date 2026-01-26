import type { Loader, LoaderInput } from "@/plugins/loader";
import { z } from "zod";
import { validate } from "@/utils/validation";
import { DataCollection, type DataTransformationContext } from "@/collections/data";
import type { DynamicCore } from "@/dynamic";

const querySchema = z
  .object({
    collection: z.string().optional(),
    workspace: z.string().optional(),
  })
  .loose();

/**
 * load data files, fallback to bundler's built-in plugins when ?collection is unspecified.
 */
export function createDataLoader(
  { getCore }: DynamicCore,
  parse: (filePath: string, source: string) => Record<string, unknown>,
  moduleType: "json" | "js" = "js",
): Loader {
  function getCollectionProcessor({ filePath, query }: LoaderInput) {
    const parsed = querySchema.safeParse(query);
    if (!parsed.success || !parsed.data.collection) return null;
    const { collection: collectionName, workspace } = parsed.data;

    return async (source: string): Promise<unknown> => {
      let core = await getCore();
      if (workspace) {
        core = core.getWorkspaces().get(workspace) ?? core;
      }

      let collection = core.getCollection(collectionName);
      let data: unknown = parse(filePath, source);
      if (!collection || !(collection instanceof DataCollection)) return data;

      const context: DataTransformationContext = {
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
      const processor = getCollectionProcessor(input);
      if (processor === null) return null;
      const data = await processor(await input.getSource());

      if (moduleType === "json") {
        return {
          code: JSON.stringify(data),
          moduleType,
        };
      } else {
        return {
          code: `export default ${JSON.stringify(data)}`,
        };
      }
    },
    bun: {
      load(source, input) {
        const processor = getCollectionProcessor(input);
        if (processor === null)
          return {
            loader: "object",
            exports: parse(input.filePath, source),
          };

        return processor(source).then((data) => ({
          loader: "object",
          exports: { default: data },
        }));
      },
    },
  };
}
