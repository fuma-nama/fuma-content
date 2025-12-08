import path from "node:path";
import { x } from "tinyexec";
import type { Plugin } from "@/core";
import { createCache } from "@/utils/async-cache";

const cache = createCache<Date | null>();

type VersionControlFn = (filePath: string) => Promise<Date | null | undefined>;

export interface LastModifiedHandler {
  /**
   * called on collections with last-modified plugin configured.
   */
  config: (context: { getLastModified: VersionControlFn }) => void;
}

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
    },
    collection(collection) {
      if (!filter(collection.name)) return;

      const handler = collection.handlers["last-modified"];
      if (!handler) return;
      handler.config({ getLastModified: fn });
    },
  };
}

async function getGitTimestamp(
  file: string,
  cwd: string,
): Promise<Date | null> {
  return cache.cached(file, async () => {
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
  });
}
