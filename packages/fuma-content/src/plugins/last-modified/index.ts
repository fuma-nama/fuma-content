import path from "node:path";
import { x } from "tinyexec";
import type { Plugin } from "@/core";

const cache = new Map<string, Promise<Date | null>>();
type VersionControlFn = (filePath: string) => Promise<Date | null | undefined>;

export interface LastModifiedPluginOptions {
  /**
   * Version control to obtain the last modified time.
   *
   * - `git`: Requires `git` to be installed.
   *
   *    If you are using Vercel, please set `VERCEL_DEEP_CLONE` environment variable to `true`.
   *
   * - A function: return the last modified time for given file path.
   *
   * @defaultValue 'git'
   */
  versionControl?: "git" | VersionControlFn;

  /**
   * Filter the collections to include by names
   */
  filter?: (collection: string) => boolean;
}

/**
 * Injects `lastModified` property to page exports.
 */
export default function lastModified(
  options: LastModifiedPluginOptions = {},
): Plugin {
  const { versionControl = "git", filter = () => true } = options;
  let fn: VersionControlFn;

  return {
    name: "last-modified",
    config() {
      const { workspace } = this.core.getOptions();
      const cwd = workspace ? path.resolve(workspace.dir) : process.cwd();

      switch (versionControl) {
        case "git":
          fn = (v) => getGitTimestamp(v, cwd);
          break;
        default:
          fn = versionControl;
      }

      for (const collection of this.core.getCollections()) {
        if (!filter(collection.name)) continue;

        const mdxHandler = collection.handlers.mdx;
        if (mdxHandler) {
          const { onGenerateList, vfile } = mdxHandler;
          mdxHandler.onGenerateList = function (gen) {
            this.codegen.addNamedImport(
              ["composerLastModified"],
              "fuma-content/plugins/last-modified/runtime",
            );
            gen.composer("composerLastModified()");
            return onGenerateList?.call(this, gen);
          };

          mdxHandler.vfile = async function (file) {
            const timestamp = await fn(file.path);
            if (timestamp) {
              file.data["mdx-export"] ??= [];
              file.data["mdx-export"].push({
                name: "lastModified",
                value: timestamp,
              });
            }
            if (vfile) return vfile?.call(this, file);
            return file;
          };
        }
      }
    },
  };
}

async function getGitTimestamp(
  file: string,
  cwd: string,
): Promise<Date | null> {
  const cached = cache.get(file);
  if (cached) return cached;

  const timePromise = (async () => {
    const out = await x(
      "git",
      ["log", "-1", '--pretty="%ai"', path.relative(cwd, file)],
      {
        nodeOptions: {
          cwd,
        },
      },
    );

    if (out.exitCode !== 0) return null;
    const date = new Date(out.stdout);
    return Number.isNaN(date.getTime()) ? null : date;
  })();

  cache.set(file, timePromise);
  return timePromise;
}
