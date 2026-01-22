import path from "node:path";
import { type Output, x } from "tinyexec";
import type { Plugin } from "@/core";
import { createCache } from "@/utils/async-cache";
import { defineCollectionHook } from "@/collections";
import { asyncHook, AsyncHook } from "@/utils/hook";

export interface GitFileData {
  /**
   * Last modified date of file, obtained from version control.
   */
  lastModified: Date | null;
  /**
   * Creation date of file, obtained from version control.
   */
  creationDate: Date | null;
}

export interface GitHook {
  /**
   * receive the client.
   */
  onClient: AsyncHook<{ client: GitClient }>;
}

export const gitHook = defineCollectionHook<GitHook>(() => ({
  onClient: asyncHook(),
}));

/**
 * Add version control integration for Git.
 * 1. Injects `creationDate` & `lastModified` properties to page exports.
 *
 * @remarks If you are using Vercel, please set `VERCEL_DEEP_CLONE` environment variable to `true`. This ensures the client can access the full commit history of Git.
 */
export default function git(): Plugin {
  let client: GitClient;

  return {
    name: "git",
    config() {
      const { cwd } = this.core.getOptions();
      client = createGitClient(cwd);
    },
    async collection(collection) {
      await collection.getPluginHook(gitHook)?.onClient.run({ client });
    },
  };
}

export interface GitClient {
  getFileData: (options: { filePath: string }) => Promise<GitFileData>;
}

function createGitClient(cwd: string): GitClient {
  const cache = createCache<GitFileData>();

  function mapDate(out: Output): Date | null {
    if (out.exitCode !== 0) return null;
    const date = new Date(out.stdout);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return {
    async getFileData({ filePath }) {
      return cache.cached(filePath, async () => {
        const relativePath = path.relative(cwd, filePath);
        const [mod, create] = await Promise.all([
          x("git", ["log", "-1", "--pretty=%ai", relativePath], {
            nodeOptions: {
              cwd,
            },
          }),
          x("git", ["log", "--diff-filter=A", "--follow", "--format=%ai", "-1", relativePath], {
            nodeOptions: {
              cwd,
            },
          }),
        ]);

        return {
          lastModified: mapDate(mod),
          creationDate: mapDate(create),
        };
      });
    },
  };
}
