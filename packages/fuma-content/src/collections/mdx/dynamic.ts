import path from "node:path";
import { fumaMatter } from "@/utils/fuma-matter";
import { createHash } from "node:crypto";
import { glob } from "tinyglobby";

async function generateCollectionObjectEntry(
  collection: DocCollectionItem,
  absolutePath: string,
) {
  const fullPath = path.relative(process.cwd(), absolutePath);
  const content = await indexFileCache.read(fullPath).catch(() => "");
  const parsed = fumaMatter(content);
  const data = await core.compilation.transform(
    {
      collection,
      filePath: fullPath,
      source: content,
    },
    parsed.data as Record<string, unknown>,
    (plugin, context, data) => plugin.doc?.frontmatter?.call(context, data),
  );

  const hash = createHash("md5").update(content).digest("hex");
  const infoStr: string[] = [
    // make sure it's included in vercel/nft
    `absolutePath: path.resolve(${JSON.stringify(fullPath)})`,
  ];
  for (const [k, v] of Object.entries({
    info: {
      fullPath,
      path: path.relative(collection.dir, absolutePath),
    },
    data,
    hash,
  } satisfies LazyEntry)) {
    infoStr.push(`${k}: ${JSON.stringify(v)}`);
  }

  return `{ ${infoStr.join(", ")} }`;
}

async function generateCollectionObject(
  parent: CollectionItem,
): Promise<string | undefined> {
  let collection: DocCollectionItem | undefined;
  if (parent.type === "doc") collection = parent;
  else if (parent.type === "docs") collection = parent.docs;

  if (!collection || !collection.dynamic) return;

  const files = await glob(collection.patterns, {
    cwd: collection.dir,
    absolute: true,
  });
  const entries = await Promise.all(
    files.map((file) => generateCollectionObjectEntry(collection, file)),
  );

  switch (parent.type) {
    case "docs": {
      const metaGlob = await generateMetaCollectionGlob(ctx, parent.meta, true);

      return `await create.docs("${parent.name}", "${getBase(parent)}", ${metaGlob}, ${entries.join(", ")})`;
    }
    case "doc":
      return `await create.doc("${collection.name}", "${getBase(collection)}", ${entries.join(", ")})`;
  }
}
