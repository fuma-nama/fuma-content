import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
import type { VersionControlFileData } from "@/plugins/git";
import type { CompiledMDX } from "@/collections/mdx/build-mdx";

export interface MDXStoreData<Frontmatter> {
  id: string;
  compiled: CompiledMDX<Frontmatter>;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
    ? _Frontmatter
    : never;

export function mdxStore<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: Record<string, unknown>,
): FileCollectionStore<MDXStoreData<GetFrontmatter<Config, Name>>> {
  const input = _input as Record<
    string,
    CompiledMDX<GetFrontmatter<Config, Name>>
  >;
  const merged = input as unknown as Record<
    string,
    MDXStoreData<GetFrontmatter<Config, Name>>
  >;

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      id: key,
      compiled: value,
    };
  }

  return new FileCollectionStore(base, merged);
}

export interface MDXStoreLazyData<Frontmatter> {
  id: string;
  frontmatter: Frontmatter;
  load: () => Promise<CompiledMDX<Frontmatter>>;
}

export function mdxStoreLazy<Config, Name extends string>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
): FileCollectionStore<MDXStoreLazyData<GetFrontmatter<Config, Name>>> {
  const input = _input as {
    head: Record<string, GetFrontmatter<Config, Name>>;
    body: Record<
      string,
      () => Promise<CompiledMDX<GetFrontmatter<Config, Name>>>
    >;
  };
  const merged: Record<
    string,
    MDXStoreLazyData<GetFrontmatter<Config, Name>>
  > = {};

  for (const [key, value] of Object.entries(input.head)) {
    merged[key] = {
      id: key,
      frontmatter: value,
      load: input.body[key],
    };
  }

  return new FileCollectionStore(base, merged);
}

export function $attachCompiled<Add>() {
  return <T>(data: T) =>
    data as T extends MDXStoreData<unknown>
      ? T & {
          compiled: Add;
        }
      : T extends MDXStoreLazyData<unknown>
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

export function $versionControl() {
  return $attachCompiled<VersionControlFileData>();
}
