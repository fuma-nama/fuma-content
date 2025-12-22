import type { LoadedConfig } from "@/config/build";
import path from "node:path";
import fs from "node:fs/promises";
import type { FSWatcher } from "chokidar";
import type { Collection } from "@/collections";
import type * as Vite from "vite";
import type { NextConfig } from "next";
import type { LoadHook } from "node:module";
import { CodeGenerator } from "@/utils/code-generator";
import type { Awaitable } from "@/types";

export interface EmitEntry {
  /**
   * path relative to output directory
   */
  path: string;
  content: string;
}

export interface PluginContext {
  core: Core;
}

export interface EmitContext extends PluginContext {
  createCodeGenerator: (
    path: string,
    content: (ctx: EmitCodeGeneratorContext) => Promise<void>,
  ) => Promise<EmitEntry>;
}

export interface EmitCodeGeneratorContext {
  core: Core;
  workspace?: string;
  codegen: CodeGenerator;
}

export interface Plugin {
  /**
   * unique name for plugin
   *
   * @example `my-package:my-plugin`
   */
  name: string;

  /**
   * on config loaded/updated
   */
  config?: (this: PluginContext, config: LoadedConfig) => Awaitable<void | LoadedConfig>;

  collection?: (this: PluginContext, collection: Collection) => Awaitable<void>;

  /**
   * Generate files (e.g. types, index file, or JSON schemas)
   */
  emit?: (this: EmitContext) => Awaitable<EmitEntry[]>;

  /**
   * Configure Fumadocs dev server
   */
  configureServer?: (this: PluginContext, server: ServerContext) => Awaitable<void>;

  vite?: {
    createPlugin?: (this: PluginContext) => Vite.PluginOption;
  };

  bun?: {
    build?: (this: PluginContext, build: Bun.PluginBuilder) => Awaitable<void>;
  };

  next?: {
    config?: (this: PluginContext, config: NextConfig) => NextConfig;
  };

  node?: {
    createLoad?: (this: PluginContext) => Awaitable<LoadHook>;
  };
}

export type PluginOption = Awaitable<Plugin | PluginOption[] | false | undefined>;

export interface ServerContext {
  /**
   * the file watcher, by default all content files are watched, along with other files.
   *
   * make sure to filter when listening to events
   */
  watcher?: FSWatcher;
}

export interface CoreOptions {
  configPath: string;
  outDir: string;
  plugins?: PluginOption[];

  emit?: {
    target?: "default" | "vite";
    /**
     * add .js extenstion to imports
     */
    jsExtension?: boolean;
  };

  /**
   * the workspace info if this instance is created as a workspace
   */
  workspace?: {
    parent: Core;
    name: string;
    dir: string;
  };
}

export interface EmitOptions {
  /**
   * filter the plugins to run emit
   */
  filterPlugin?: (plugin: Plugin) => boolean;

  /**
   * filter the workspaces to run emit
   */
  filterWorkspace?: (workspace: string) => boolean;

  /**
   * write files
   */
  write?: boolean;
}

export interface EmitOutput {
  entries: EmitEntry[];
  workspaces: Record<string, EmitEntry[]>;
}

async function getPlugins(pluginOptions: PluginOption[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  for (const option of await Promise.all(pluginOptions)) {
    if (!option) continue;
    if (Array.isArray(option)) plugins.push(...(await getPlugins(option)));
    else plugins.push(option);
  }

  return plugins;
}

export class Core {
  private readonly workspaces = new Map<string, Core>();
  private readonly options: CoreOptions;
  private plugins: Plugin[] = [];
  private config!: LoadedConfig;
  static defaultOptions = {
    configPath: "content.config.ts",
    outDir: ".content",
  };

  /**
   * Convenient cache store, reset when config changes.
   *
   * You can group namespaces in cache key with ":", like `my-plugin:data`
   */
  readonly cache = new Map<string, unknown>();

  constructor(options: CoreOptions) {
    this.options = options;
  }

  async init({ config: newConfig }: { config: Awaitable<LoadedConfig> }) {
    this.config = await newConfig;
    this.cache.clear();
    this.workspaces.clear();
    const loadedCollectionTypeIds = new Set<string>();
    this.plugins = await getPlugins([
      this.options.plugins,
      this.config.plugins,
      ...this.config.collections.values().map(({ typeInfo }) => {
        if (loadedCollectionTypeIds.has(typeInfo.id)) return false;

        loadedCollectionTypeIds.add(typeInfo.id);
        return typeInfo.plugins;
      }),
    ]);

    const ctx = this.getPluginContext();
    for (const plugin of this.plugins) {
      const out = await plugin.config?.call(ctx, this.config);
      if (out) this.config = out;
    }

    const { workspace, outDir } = this.options;
    // only support workspaces with max depth 1
    if (!workspace) {
      await Promise.all(
        Object.entries(this.config.workspaces).map(async ([name, workspace]) => {
          const child = new Core({
            ...this.options,
            outDir: path.join(outDir, name),
            workspace: {
              name,
              parent: this,
              dir: workspace.dir,
            },
          });

          await child.init({ config: workspace.config });
          this.workspaces.set(name, child);
        }),
      );
    }

    await Promise.all(
      this.config.collections.values().map(async (collection) => {
        for (const plugin of this.plugins) {
          await plugin.collection?.call(ctx, collection);
        }
      }),
    );
  }

  getWorkspaces() {
    return this.workspaces;
  }
  getOptions() {
    return this.options;
  }
  getConfig(): LoadedConfig {
    return this.config;
  }
  /**
   * The file path of compiled config file, the file may not exist (e.g. on Vite, or still compiling)
   */
  getCompiledConfigPath(): string {
    return path.join(this.options.outDir, "content.config.mjs");
  }
  getPlugins(workspace = false) {
    if (workspace) {
      const plugins = [...this.plugins];
      for (const workspace of this.workspaces.values()) {
        plugins.push(...workspace.plugins);
      }
      return plugins;
    }

    return this.plugins;
  }
  getCollections(workspace = false): Collection[] {
    const list = Array.from(this.config.collections.values());
    if (workspace) {
      for (const workspace of this.workspaces.values()) {
        list.push(...workspace.getCollections());
      }
    }
    return list;
  }
  getCollection(name: string): Collection | undefined {
    return this.config.collections.get(name);
  }
  getPluginContext(): PluginContext {
    return {
      core: this,
    };
  }
  async initServer(server: ServerContext) {
    const ctx = this.getPluginContext();
    const promises: Awaitable<void>[] = [];

    for (const plugin of this.plugins) {
      promises.push(plugin.configureServer?.call(ctx, server));
    }
    for (const workspace of this.workspaces.values()) {
      promises.push(workspace.initServer(server));
    }

    await Promise.all(promises);
  }

  async emit(emitOptions: EmitOptions = {}): Promise<EmitOutput> {
    const { workspace, outDir, emit: { target, jsExtension } = {} } = this.options;
    const { filterPlugin, filterWorkspace, write = false } = emitOptions;
    const start = performance.now();
    const globCache = new Map<string, Promise<string[]>>();
    const ctx: EmitContext = {
      ...this.getPluginContext(),
      createCodeGenerator: async (path, content) => {
        const codegen = new CodeGenerator({
          target,
          outDir,
          jsExtension,
          globCache,
        });
        await content({
          core: this,
          codegen,
          workspace: workspace?.name,
        });
        return {
          path,
          content: codegen.toString(),
        };
      },
    };

    const added = new Set<string>();
    const out: EmitOutput = {
      entries: [],
      workspaces: {},
    };

    for (const li of await Promise.all(
      this.plugins.map((plugin) => {
        if ((filterPlugin && !filterPlugin(plugin)) || !plugin.emit) return null;
        return plugin.emit.call(ctx);
      }),
    )) {
      if (!li) continue;
      for (const item of li) {
        if (added.has(item.path)) continue;
        out.entries.push(item);
        added.add(item.path);
      }
    }

    if (write) {
      await Promise.all(
        out.entries.map(async (entry) => {
          const file = path.join(outDir, entry.path);
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, entry.content);
        }),
      );

      console.log(
        workspace
          ? `[MDX: ${workspace.name}] generated files in ${performance.now() - start}ms`
          : `[MDX] generated files in ${performance.now() - start}ms`,
      );
    }

    await Promise.all(
      this.workspaces.entries().map(async ([name, workspace]) => {
        if (filterWorkspace && !filterWorkspace(name)) return;
        out.workspaces[name] = (await workspace.emit(emitOptions)).entries;
      }),
    );

    return out;
  }
}
