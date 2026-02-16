import type { StandardSchemaV1 } from "@standard-schema/spec";
import { mdxCollection, type MDXCollectionConfig } from "./mdx";
import { remarkObsidian } from "./obsidian/remark-obsidian";

export function mdxObsidianCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
>(config: MDXCollectionConfig<FrontmatterSchema>) {
  return mdxCollection({
    ...config,
    preprocess: {
      ...config.preprocess,
      remarkPlugins: [remarkObsidian, ...(config.preprocess?.remarkPlugins ?? [])],
    },
    async options(environment) {
      const base = await config.options?.(environment);

      return {
        ...base,
        remarkPlugins: [remarkObsidian, ...(base?.remarkPlugins ?? [])],
      };
    },
  });
}
