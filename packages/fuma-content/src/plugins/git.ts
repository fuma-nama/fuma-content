import path from "node:path";
import { type Output, x } from "tinyexec";
import type { Plugin } from "@/core";
import { createCache } from "@/utils/async-cache";

export interface VersionControlFileData {
  /**
   * Last modified date of file, obtained from version control.
   */
  lastModified: Date | null;
  /**
   * Creation date of file, obtained from version control.
   */
  creationDate: Date | null;
}

export interface VersionControlHandler {
  /**
   * receive the version control client.
   */
  client: (context: { client: VersionControlClient }) => void | Promise<void>;
}

export interface GitPluginOptions {
  /**
   * Filter the collections to include by names
   */
  filter?: (collection: string) => boolean;
}

/**
 * Add version control integration for Git.
 * 1. Injects `creationDate` & `lastModified` properties to page exports.
 *
 * @remarks If you are using Vercel, please set `VERCEL_DEEP_CLONE` environment variable to `true`. This ensures the client can access the full commit history of Git.
 */
export default function git(options: GitPluginOptions = {}): Plugin {
  const { filter = () => true } = options;
  let client: VersionControlClient;

  return {
    name: "git",
    config() {
      const { workspace } = this.core.getOptions();
      const cwd = workspace ? path.resolve(workspace.dir) : process.cwd();

      client = createGitClient(cwd);
    },
    collection(collection) {
      if (!filter(collection.name)) return;

      const handler = collection.handlers["version-control"];
      if (!handler) return;
      return handler.client({ client });
    },
  };
}

export interface VersionControlClient {
  getFileData: (options: {
    filePath: string;
  }) => Promise<VersionControlFileData>;
}

function createGitClient(cwd: string): VersionControlClient {
  const cache = createCache<VersionControlFileData>();

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
          x(
            "git",
            [
              "log",
              "--diff-filter=A",
              "--follow",
              "--format=%ai",
              "-1",
              relativePath,
            ],
            {
              nodeOptions: {
                cwd,
              },
            },
          ),
        ]);

        return {
          lastModified: mapDate(mod),
          creationDate: mapDate(create),
        };
      });
    },
  };
}
