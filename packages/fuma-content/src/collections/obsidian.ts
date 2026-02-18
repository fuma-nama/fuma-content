import type { StandardSchemaV1 } from "@standard-schema/spec";
import { mdxCollection, type MDXCollectionConfig } from "./mdx";
import { remarkObsidian } from "./obsidian/remark-obsidian";

export type MDXObsidianCollectionConfig<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
> = MDXCollectionConfig<FrontmatterSchema>;

export function mdxObsidianCollection<
  FrontmatterSchema extends StandardSchemaV1 | undefined = undefined,
>(config: MDXObsidianCollectionConfig<FrontmatterSchema>) {
  return mdxCollection({
    ...config,
    async options(environment) {
      const base =
        typeof config.options === "function" ? await config.options?.(environment) : config.options;

      return {
        ...base,
        remarkPlugins: ({ remarkInclude, remarkPostprocess }) =>
          typeof base?.remarkPlugins === "function"
            ? [remarkObsidian, ...base.remarkPlugins({ remarkInclude, remarkPostprocess })]
            : [remarkObsidian, remarkInclude, ...(base?.remarkPlugins ?? []), remarkPostprocess],
      };
    },
  });
}
