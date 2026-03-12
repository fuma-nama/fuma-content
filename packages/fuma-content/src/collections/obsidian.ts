import type { StandardSchemaV1 } from "@standard-schema/spec";
import { mdxCollection, type MDXCollectionConfig } from "./mdx";
import { remarkObsidian } from "./obsidian/remark-obsidian";
import { remarkInclude } from "@/plugins/remark/include";

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
        remarkPlugins: ({ preprocess, postprocess }) =>
          typeof base?.remarkPlugins === "function"
            ? base.remarkPlugins({
                preprocess: [remarkObsidian, remarkInclude, ...preprocess],
                postprocess,
              })
            : [
                remarkObsidian,
                remarkInclude,
                ...preprocess,
                ...(base?.remarkPlugins ?? []),
                ...postprocess,
              ],
      };
    },
  });
}
