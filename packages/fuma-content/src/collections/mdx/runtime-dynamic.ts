import { buildConfig } from "@/config/build";
import { buildMDX, type CompiledMDX } from "@/collections/mdx/build-mdx";
import { pathToFileURL } from "node:url";
import { fumaMatter } from "@/utils/fuma-matter";
import fs from "node:fs/promises";
import { type CoreOptions, Core } from "@/core";
import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import jsxRuntimeDefault from "react/jsx-runtime";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { GetCollectionConfig } from "@/types";
import type { MDXCollection } from "@/collections/mdx";
import path from "node:path";
import { createCache } from "@/utils/async-cache";
import type { ExtractedReference } from "@/collections/mdx/remark-postprocess";
import type { VersionControlFileData } from "@/plugins/git";

export interface MDXStoreDynamicData<Frontmatter> {
  id: string;
  frontmatter: Frontmatter;
  compile: () => Promise<CompiledMDX<Frontmatter>>;
}

let corePromise: Promise<Core>;

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection<infer _Frontmatter>
    ? _Frontmatter
    : never;

export async function mdxStoreDynamic<Config, Name extends string>(
  config: Config,
  coreOptions: CoreOptions,
  name: Name,
  base: string,
  _frontmatter: Record<string, unknown>,
): Promise<
  FileCollectionStore<MDXStoreDynamicData<GetFrontmatter<Config, Name>>>
> {
  corePromise ??= (async () => {
    const core = new Core(coreOptions);
    await core.init({
      config: buildConfig(config as Record<string, unknown>),
    });
    return core;
  })();
  const core = await corePromise;
  const frontmatter = _frontmatter as Record<
    string,
    GetFrontmatter<Config, Name>
  >;
  const collection = core.getCollection(name);
  if (!collection || !collection.handlers.mdx)
    throw new Error("invalid collection name");

  const merged: Record<
    string,
    MDXStoreDynamicData<GetFrontmatter<Config, Name>>
  > = {};
  const cache = createCache<CompiledMDX<GetFrontmatter<Config, Name>>>();

  for (const [k, v] of Object.entries(frontmatter)) {
    merged[k] = {
      id: k,
      frontmatter: v,
      async compile() {
        return cache.cached(k, async () => {
          const filePath = path.join(base, k);
          let content = (await fs.readFile(filePath)).toString();
          content = fumaMatter(content).content;

          const compiled = await buildMDX(core, collection, {
            filePath,
            source: content,
            frontmatter: v as unknown as Record<string, unknown>,
            isDevelopment: false,
            environment: "runtime",
          });

          return (await executeMdx(String(compiled.value), {
            baseUrl: pathToFileURL(filePath),
          })) as CompiledMDX<GetFrontmatter<Config, Name>>;
        });
      },
    };
  }

  return new FileCollectionStore(base, merged);
}

export type MdxContent = FC<{ components?: MDXComponents }>;

interface Options {
  scope?: Record<string, unknown>;
  baseUrl?: string | URL;
  jsxRuntime?: unknown;
}

const AsyncFunction: new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown> =
  Object.getPrototypeOf(executeMdx).constructor;

async function executeMdx(compiled: string, options: Options = {}) {
  const { opts: scopeOpts, ...scope } = options.scope ?? {};
  const fullScope = {
    opts: {
      ...(scopeOpts as object),
      ...(options.jsxRuntime ?? jsxRuntimeDefault),
      baseUrl: options.baseUrl,
    },
    ...scope,
  };

  const hydrateFn = new AsyncFunction(...Object.keys(fullScope), compiled);
  return (await hydrateFn.apply(hydrateFn, Object.values(fullScope))) as {
    default: MdxContent;
  };
}

export function $attachCompiled<Add>() {
  return <T>(data: T) =>
    data as T extends MDXStoreDynamicData<unknown>
      ? T & {
          compile: () => Promise<Awaited<ReturnType<T["compile"]>> & Add>;
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
