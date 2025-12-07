import type { Loader, LoaderInput } from "@/plugins/with-loader";
import { dump, load } from "js-yaml";
import { z } from "zod";
import { validate } from "@/utils/validation";
import type { MetaContext } from "@/config/collections/meta";
import type { DynamicCore } from "@/config/dynamic";

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
    yaml?: "yaml" | "js";
  } = {},
): Loader {
  const { json: resolveJson = "js", yaml: resolveYaml = "js" } = resolve;

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

      const collection = core.getCollection(collectionName);
      const handler = collection?.handlers.meta;
      let data: unknown = parse(filePath, source);
      if (!handler) return data;

      const context: MetaContext = {
        path: filePath,
        source,
      };

      if (handler.schema) {
        data = await validate(
          handler.schema,
          data,
          context,
          `invalid data in ${filePath}`,
        );
      }

      return handler.transform?.call(context, data);
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
        };
      } else {
        return {
          code:
            resolveYaml === "yaml"
              ? dump(data)
              : `export default ${JSON.stringify(data)}`,
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
