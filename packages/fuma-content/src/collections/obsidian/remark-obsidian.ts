import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";
import { buildStorage, normalize, VaultStorage } from "./build-storage";
import { buildResolver, VaultResolver } from "./build-resolver";
import path from "node:path";
import { transformBlocks } from "./remark-block-id";
import { transform } from "./remark-convert";
import { removeComment } from "./remark-obsidian-comment";
import { transformWikilinks } from "./remark-wikilinks";
import { MDXCollection } from "../mdx";

declare module "vfile" {
  interface DataMap {
    _obsidian_transformed?: boolean;
  }
}

export function remarkObsidian(this: Processor): Transformer<Root, Root> {
  const cache = new WeakMap<
    MDXCollection,
    {
      resolver: VaultResolver;
      storage: VaultStorage;
    }
  >();

  return async (tree, file) => {
    if (file.data._obsidian_transformed) return tree;
    const compiler = file.data._compiler;

    if (!compiler || !(compiler.collection instanceof MDXCollection)) return tree;
    const collection = compiler.collection;
    let cached = cache.get(collection);

    if (!cached) {
      const files = await collection.getFiles();
      const storage = await buildStorage({
        files: files.map((file) => path.join(collection.dir, file)),
        dir: collection.dir,
        url: () => undefined,
        outputPath: "ignore",
        enforceMdx: false,
      });
      const resolver = buildResolver(storage);

      cached = { resolver, storage };
      cache.set(collection, cached);
    }

    const { storage, resolver } = cached;
    const normalizedPath = normalize(path.relative(collection.dir, file.path));
    const vault = storage.files.get(normalizedPath);

    if (vault?.format === "content") {
      tree = transformWikilinks(tree, vault, resolver);
      tree = transform(tree, vault, resolver);
      tree = removeComment(tree);
      tree = transformBlocks(tree);
      file.data._obsidian_transformed = true;
      return tree;
    }

    return tree;
  };
}
