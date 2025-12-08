import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { CollectionList } from "@/collections/list/runtime";
import { type FileInfo, globToFileList } from "@/collections/file-list/runtime";
import type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
import type { FC } from "react";
import type { MDXProps } from "mdx/types";

export type CompiledMDXProperties<Frontmatter = Record<string, unknown>> = {
  frontmatter: Frontmatter;
  default: FC<MDXProps>;

  /**
   * Enable from `postprocess` option.
   */
  _markdown?: string;
  /**
   * Enable from `postprocess` option.
   */
  _mdast?: string;
} & Record<string, unknown>;

export interface MDXListEntry<Frontmatter> extends FileInfo {
  compiled: CompiledMDXProperties<Frontmatter>;
}

export interface MDXListEntryLazy<Frontmatter> extends FileInfo {
  frontmatter: Frontmatter;
  load: () => Promise<CompiledMDXProperties<Frontmatter>>;
}

export function mdxList<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: Record<string, unknown>,
) {
  const input = _input as Record<string, CompiledMDXProperties<Frontmatter>>;
  type FrontmatterSchema =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer MDXConfig>
      ? MDXConfig["frontmatter"]
      : never;
  type Frontmatter = FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown>;
  const merged: Record<
    string,
    {
      compiled: CompiledMDXProperties<Frontmatter>;
    }
  > = {};

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      compiled: value,
    };
  }

  const list: CollectionList<MDXListEntry<Frontmatter>> = globToFileList(
    base,
    merged,
  );
  return list;
}

export function mdxListLazy<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
) {
  const input = _input as {
    head: Record<string, Frontmatter>;
    body: Record<string, () => Promise<CompiledMDXProperties<Frontmatter>>>;
  };

  type FrontmatterSchema =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer MDXConfig>
      ? MDXConfig["frontmatter"]
      : never;
  type Frontmatter = FrontmatterSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<FrontmatterSchema>
    : Record<string, unknown>;

  const merged: Record<
    string,
    {
      frontmatter: Frontmatter;
      load: () => Promise<CompiledMDXProperties<Frontmatter>>;
    }
  > = {};

  for (const [key, value] of Object.entries(input.head)) {
    merged[key] = {
      frontmatter: value,
      load: input.body[key],
    };
  }

  const list: CollectionList<MDXListEntryLazy<Frontmatter>> = globToFileList(
    base,
    merged,
  );
  return list;
}

export function composerAttachCompiled<Add>() {
  return <T>(data: T[]) =>
    data as T extends MDXListEntry<unknown>
      ? (T & {
          compiled: Add;
        })[]
      : T extends MDXListEntryLazy<unknown>
        ? (T & {
            load: () => Promise<Awaited<ReturnType<T["load"]>> & Add>;
          })[]
        : T[];
}

export function extractedReferencesComposer() {
  return composerAttachCompiled<{
    /**
     * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
     */
    extractedReferences: ExtractedReference[];
  }>();
}
