import type { GetCollectionConfig } from "@/types";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { ComarkTree } from "comark";

export type ParsedComark<Frontmatter> = Omit<ComarkTree, "frontmatter"> & {
  frontmatter: Frontmatter;
};

export interface ComarkStoreData<Frontmatter, Attached = unknown> {
  id: string;
  tree: ParsedComark<Frontmatter> & Attached;
}

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends { $inferFrontmatter: unknown }
    ? GetCollectionConfig<Config, Name>["$inferFrontmatter"]
    : never;

export function comarkStore<Config, Name extends string, Attached>(
  _name: Name,
  base: string,
  _input: Record<string, unknown>,
): FileCollectionStore<ComarkStoreData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as Record<string, ParsedComark<GetFrontmatter<Config, Name>> & Attached>;
  const merged: Record<string, ComarkStoreData<GetFrontmatter<Config, Name>, Attached>> = {};

  for (const [key, value] of Object.entries(input)) {
    merged[key] = {
      id: key,
      tree: value,
    };
  }

  return new FileCollectionStore(base, merged);
}

export interface ComarkStoreLazyData<Frontmatter, Attached> {
  id: string;
  frontmatter: Frontmatter;
  load: () => Promise<ParsedComark<Frontmatter> & Attached>;
}

export function comarkStoreLazy<Config, Name extends string, Attached>(
  _name: Name,
  base: string,
  _input: {
    head: Record<string, unknown>;
    body: Record<string, () => Promise<unknown>>;
  },
): FileCollectionStore<ComarkStoreLazyData<GetFrontmatter<Config, Name>, Attached>> {
  const input = _input as {
    head: Record<string, GetFrontmatter<Config, Name>>;
    body: Record<string, () => Promise<ParsedComark<GetFrontmatter<Config, Name>> & Attached>>;
  };
  const merged: Record<string, ComarkStoreLazyData<GetFrontmatter<Config, Name>, Attached>> = {};

  for (const [key, value] of Object.entries(input.head)) {
    merged[key] = {
      id: key,
      frontmatter: value,
      load: input.body[key],
    };
  }

  return new FileCollectionStore(base, merged);
}
