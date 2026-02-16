import { fumaMatter } from "@/collections/mdx/fuma-matter";
import type { SourceMap } from "rollup";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Loader } from "@/plugins/loader";
import type { DynamicCore } from "@/dynamic";
import { MDXCollection } from "../mdx";

const querySchema = z
  .object({
    only: z.literal(["frontmatter", "all"]).default("all"),
    collection: z.string().optional(),
    workspace: z.string().optional(),
  })
  .loose();

const cacheEntry = z.object({
  code: z.string(),
  map: z.any().optional(),
  hash: z.string().optional(),
});

type CacheEntry = z.infer<typeof cacheEntry>;

export function createMdxLoader({ getCore }: DynamicCore): Loader {
  return {
    async load({ getSource, development: isDevelopment, query, addDependency, filePath }) {
      let core = await getCore();
      const value = await getSource();
      const matter = fumaMatter(value);
      const { collection: collectionName, workspace, only } = querySchema.parse(query);
      if (workspace) {
        core = core.getWorkspaces().get(workspace) ?? core;
      }

      let after: (() => Promise<void>) | undefined;

      const { experimentalBuildCache = false } = core.getConfig();
      if (!isDevelopment && experimentalBuildCache) {
        const cacheDir = experimentalBuildCache;
        const cacheKey = `${collectionName ?? "global"}_${generateCacheHash(filePath)}`;

        const cached = await fs
          .readFile(path.join(cacheDir, cacheKey))
          .then((content) => cacheEntry.parse(JSON.parse(content.toString())))
          .catch(() => null);

        if (cached && cached.hash === generateCacheHash(value)) return cached;
        after = async () => {
          await fs.mkdir(cacheDir, { recursive: true });
          await fs.writeFile(
            path.join(cacheDir, cacheKey),
            JSON.stringify({
              ...out,
              hash: generateCacheHash(value),
            } satisfies CacheEntry),
          );
        };
      }

      let collection = collectionName ? core.getCollection(collectionName) : undefined;
      if (!(collection instanceof MDXCollection)) collection = undefined;

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

      // ensure the line number is correct in dev mode
      const lineOffset = isDevelopment ? countLines(matter.matter) : 0;

      const { buildMDX } = await import("@/collections/mdx/build-mdx");
      const compiled = await buildMDX(core, collection, {
        isDevelopment,
        source: "\n".repeat(lineOffset) + matter.content,
        filePath,
        frontmatter: matter.data as Record<string, unknown>,
        compiler: {
          addDependency,
          collection,
          core,
        },
        environment: "bundler",
      });

      const out = {
        code: String(compiled.value),
        map: compiled.map as SourceMap,
      };

      await after?.();
      return out;
    },
  };
}

function generateCacheHash(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

function countLines(s: string) {
  let num = 0;

  for (const c of s) {
    if (c === "\n") num++;
  }

  return num;
}
