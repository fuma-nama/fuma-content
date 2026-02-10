import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { LinkReference } from "@/collections/mdx/remark-postprocess";
import type { GitFileData } from "@/plugins/git";
import type { CompiledMDX } from "@/collections/mdx/build-mdx";

export interface MDXStoreData<Frontmatter, Attached = unknown> {
  id: string;
  compiled: CompiledMDX<Frontmatter> & Attached;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection
    ? GetCollectionConfig<Config, Name>["$inferFrontmatter"]
    : never;

export function mdxStore<Config, Name extends string, Attached>(
  _name: Name,
  base: string,
  _input: Record<string, unknown>,
): FileCollectionStore<MDXStoreData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as Record<string, CompiledMDX<GetFrontmatter<Config, Name>> & Attached>;
  const merged: Record<string, MDXStoreData<GetFrontmatter<Config, Name>, Attached>> = {};

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      id: key,
      compiled: value,
    };
  }

  return new FileCollectionStore(base, merged);
}

export interface MDXStoreLazyData<Frontmatter, Attached> {
  id: string;
  frontmatter: Frontmatter;
  load: () => Promise<CompiledMDX<Frontmatter> & Attached>;
}

export function mdxStoreLazy<Config, Name extends string, Attached>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
): FileCollectionStore<MDXStoreLazyData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as {
    head: Record<string, GetFrontmatter<Config, Name>>;
    body: Record<string, () => Promise<CompiledMDX<GetFrontmatter<Config, Name>> & Attached>>;
  };
  const merged: Record<string, MDXStoreLazyData<GetFrontmatter<Config, Name>, Attached>> = {};

  for (const [key, value] of Object.entries(input.head)) {
    merged[key] = {
      id: key,
      frontmatter: value,
      load: input.body[key],
    };
  }

  return new FileCollectionStore(base, merged);
}

export type WithGit = GitFileData;
