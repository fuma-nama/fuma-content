import type { Core, Plugin } from "@/core";
import { CodeGenerator } from "@/utils/code-generator";
import { createFSCache } from "@/utils/fs-cache";
import type { EmitEntry } from "@/core";

export interface IndexFilePluginOptions {
  target?: "default" | "vite";

  /**
   * add `.js` extensions to imports, needed for ESM without bundler resolution
   */
  addJsExtension?: boolean;

  /**
   * Generate entry point for browser
   * @defaultValue true
   */
  browser?: boolean;

  /**
   * Generate entry point for dynamic compilation
   * @defaultValue true
   */
  dynamic?: boolean;
}

export interface EntryFileHandler {
  server?: (context: EntryFileContext) => void | Promise<void>;
  browser?: (context: EntryFileContext) => void | Promise<void>;

  rerunOnFileChange?: boolean;
}

export interface EntryFileContext {
  core: Core;
  workspace?: string;
  codegen: CodeGenerator;
}

const indexFileCache = createFSCache();

export default function entryFile(
  options: IndexFilePluginOptions = {},
): Plugin {
  const {
    target = "default",
    addJsExtension,
    browser = true,
    dynamic = true,
  } = options;

  return {
    name: "index-file",
    configureServer(server) {
      if (!server.watcher) return;

      server.watcher.on("all", async (event, file) => {
        indexFileCache.delete(file);

        const updatedCollection = this.core
          .getCollections()
          .find((collection) => {
            if (!collection.handlers.fs) return false;
            const handler = collection.handlers["entry-file"];
            if (!handler) return false;
            if (event === "change" && !handler.rerunOnFileChange) return false;

            return collection.handlers.fs.hasFile(file);
          });

        if (!updatedCollection) return;
        await this.core.emit({
          filterPlugin: (plugin) => plugin.name === "index-file",
          filterWorkspace: () => false,
          write: true,
        });
      });
    },
    async emit() {
      const globCache = new Map<string, Promise<string[]>>();
      const { workspace, outDir } = this.core.getOptions();

      const toEmitEntry = async (
        path: string,
        content: (ctx: EntryFileContext) => Promise<void>,
      ): Promise<EmitEntry> => {
        const codegen = new CodeGenerator({
          target,
          outDir: outDir,
          jsExtension: addJsExtension,
          globCache,
        });
        await content({
          core: this.core,
          codegen,
          workspace: workspace?.name,
        });
        return {
          path,
          content: codegen.toString(),
        };
      };

      const out: Promise<EmitEntry>[] = [
        toEmitEntry("server.ts", (ctx) => generateEntryFile(ctx, "server")),
      ];

      if (browser) {
        out.push(
          toEmitEntry("browser.ts", (ctx) => generateEntryFile(ctx, "browser")),
        );
      }

      return await Promise.all(out);
    },
  };
}

async function generateEntryFile(
  ctx: EntryFileContext,
  variant: "server" | "browser",
) {
  const { core, codegen } = ctx;
  codegen.addNamedImport(
    ["default as Config"],
    codegen.formatImportPath(core.getOptions().configPath),
    true,
  );
  for (const collection of core.getCollections()) {
    const handler = collection.handlers["entry-file"];
    if (!handler) continue;

    await handler[variant]?.(ctx);
  }
}
