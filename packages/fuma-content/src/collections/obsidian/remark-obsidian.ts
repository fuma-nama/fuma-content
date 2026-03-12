import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";
import { buildStorage, normalize, VaultStorage } from "./build-storage";
import { buildResolver, VaultResolver } from "./build-resolver";
import path from "node:path";
import { transform } from "./utils/transform";
import { MDXCollection } from "../mdx";
import { percentCommentFromMarkdown, percentCommentMicromark } from "./utils/micromark-comments";

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

  const data = this.data();
  const micromarkExtensions = (data.micromarkExtensions ??= []);
  const fromMarkdownExtensions = (data.fromMarkdownExtensions ??= []);
  micromarkExtensions.push(percentCommentMicromark());
  fromMarkdownExtensions.push(percentCommentFromMarkdown());

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
      tree = transform(tree, vault, resolver);
      file.data._obsidian_transformed = true;
      return tree;
    }

    return tree;
  };
}
