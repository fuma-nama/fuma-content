import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import { FileCollectionStore } from "@/collections/runtime/file-store";
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

export function mdxStore<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: Record<string, unknown>,
): FileCollectionStore<{
  compiled: CompiledMDXProperties<
    GetCollectionConfig<Config, Name> extends MDXCollection<infer Frontmatter>
      ? Frontmatter
      : never
  >;
}> {
  type Frontmatter =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
      ? _Frontmatter
      : never;
  const input = _input as Record<string, CompiledMDXProperties<Frontmatter>>;
  const merged = input as unknown as Record<
    string,
    {
      compiled: CompiledMDXProperties<Frontmatter>;
    }
  >;

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      compiled: value,
    };
  }

  return new FileCollectionStore(base, merged);
}

export function mdxStoreLazy<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
): FileCollectionStore<{
  frontmatter: GetCollectionConfig<Config, Name> extends MDXCollection<
    infer Frontmatter
  >
    ? Frontmatter
    : never;
  load: () => Promise<
    CompiledMDXProperties<
      GetCollectionConfig<Config, Name> extends MDXCollection<infer Frontmatter>
        ? Frontmatter
        : never
    >
  >;
}> {
  type Frontmatter =
    GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
      ? _Frontmatter
      : never;
  const input = _input as {
    head: Record<string, Frontmatter>;
    body: Record<string, () => Promise<CompiledMDXProperties<Frontmatter>>>;
  };

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

  return new FileCollectionStore(base, merged);
}

export function $attachCompiled<Add>() {
  return <T>(data: T) =>
    data as T extends { compiled: unknown }
      ? T & {
          compiled: Add;
        }
      : T extends { load: () => Promise<unknown> }
        ? T & {
            load: () => Promise<Awaited<ReturnType<T["load"]>> & Add>;
          }
        : T;
}

export function $extractedReferences() {
  return $attachCompiled<{
    /**
     * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
     */
    extractedReferences: ExtractedReference[];
  }>();
}

export function $lastModified() {
  return $attachCompiled<{
    /**
     * Last modified date of document file, obtained from version control.
     *
     */
    lastModified?: Date;
  }>();
}
