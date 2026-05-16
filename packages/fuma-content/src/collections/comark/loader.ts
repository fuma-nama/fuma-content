import { parseFrontmatter } from "@/utils/frontmatter";
import { z } from "zod";
import type { Loader } from "@/plugins/loader";
import type { DynamicCore } from "@/dynamic";
import { ComarkCollection } from "../comark";

const querySchema = z
  .object({
    only: z.literal(["frontmatter", "all"]).default("all"),
    collection: z.string().optional(),
    workspace: z.string().optional(),
  })
  .loose();

export function createComarkLoader({ getCore }: DynamicCore): Loader {
  return {
    async load({ getSource, query, filePath }) {
      let core = await getCore();
      const value = await getSource();
      const matter = parseFrontmatter(value);
      const { collection: collectionName, workspace, only } = querySchema.parse(query);
      if (workspace) {
        core = core.getWorkspaces().get(workspace) ?? core;
      }

      let collection = collectionName ? core.getCollection(collectionName) : undefined;
      if (!(collection instanceof ComarkCollection)) {
        if (collectionName) return null;
        collection = undefined;
      }

      if (collection?.frontmatter) {
        matter.data = await collection.frontmatter.run(matter.data as Record<string, unknown>, {
          collection,
          filePath,
          source: value,
        });
      }

      if (only === "frontmatter") {
        return {
          code: `export const frontmatter = ${JSON.stringify(matter.data)}`,
          map: null,
        };
      }

      const { parse } = await import("comark");
      let tree = await parse(value, await collection?.getComarkOptions("bundler"));
      tree.frontmatter = matter.data as Record<string, unknown>;

      if (collection?.tree) {
        tree = await collection.tree.run(tree, {
          collection,
          filePath,
          source: value,
        });
      }

      const serialized = JSON.stringify(tree);
      return {
        code: `export const frontmatter = ${JSON.stringify(tree.frontmatter)};
export const tree = ${serialized};
export default tree;`,
        map: null,
      };
    },
  };
}
