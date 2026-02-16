import { buildMDX, type CompiledMDX } from "@/collections/mdx/build-mdx";
import { pathToFileURL } from "node:url";
import { fumaMatter } from "@/collections/mdx/fuma-matter";
import fs from "node:fs/promises";
import { type CoreOptions, Core } from "@/core";
import type { MDXContent } from "mdx/types";
import { FileCollectionStore } from "@/collections/runtime/file-store";
import type { GetCollectionConfig } from "@/types";
import { MDXCollection } from "@/collections/mdx";
import path from "node:path";
import { createCache } from "@/utils/async-cache";

export interface MDXStoreDynamicData<Frontmatter, Attached = unknown> {
  id: string;
  frontmatter: Frontmatter;
  compile: () => Promise<CompiledMDX<Frontmatter> & Attached>;
}

let corePromise: Promise<Core>;

type GetFrontmatter<Config, Name extends string> =
  GetCollectionConfig<Config, Name> extends MDXCollection
    ? GetCollectionConfig<Config, Name>["$inferFrontmatter"]
    : never;

export async function mdxStoreDynamic<Config, Name extends string, Attached>(
  config: Config,
  coreOptions: CoreOptions,
  name: Name,
  base: string,
  _frontmatter: Record<string, unknown>,
  jsxRuntime: unknown,
): Promise<FileCollectionStore<MDXStoreDynamicData<GetFrontmatter<Config, Name>, Attached>>> {
  corePromise ??= (async () => {
    const core = new Core(coreOptions);
    await core.init({
      config: config as Record<string, unknown>,
    });
    return core;
  })();
  const core = await corePromise;
  const frontmatter = _frontmatter as Record<string, GetFrontmatter<Config, Name>>;
  const collection = core.getCollection(name);
  if (!collection || !(collection instanceof MDXCollection))
    throw new Error("invalid collection name");

  const merged: Record<string, MDXStoreDynamicData<GetFrontmatter<Config, Name>, Attached>> = {};
  const cache = createCache<CompiledMDX<GetFrontmatter<Config, Name>> & Attached>();

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
            compiler: {
              collection,
              core,
              addDependency() {},
            },
          });

          return (await executeMdx(String(compiled.value), {
            baseUrl: pathToFileURL(filePath),
            jsxRuntime,
          })) as CompiledMDX<GetFrontmatter<Config, Name>> & Attached;
        });
      },
    };
  }

  return new FileCollectionStore(base, merged);
}

export type MdxContent = MDXContent;

interface Options {
  scope?: Record<string, unknown>;
  baseUrl?: string | URL;
  jsxRuntime?: unknown;
}

const AsyncFunction: new (...args: string[]) => (...args: unknown[]) => Promise<unknown> =
  Object.getPrototypeOf(executeMdx).constructor;

async function executeMdx(compiled: string, options: Options = {}) {
  const { opts: scopeOpts, ...scope } = options.scope ?? {};
  const fullScope = {
    opts: {
      ...(scopeOpts as object),
      ...(options.jsxRuntime as object),
      baseUrl: options.baseUrl,
    },
    ...scope,
  };

  const hydrateFn = new AsyncFunction(...Object.keys(fullScope), compiled);
  return (await hydrateFn.apply(hydrateFn, Object.values(fullScope))) as {
    default: MdxContent;
  };
}

export type { WithGit } from "./runtime";
