import path from "node:path";
import fs from "node:fs/promises";
import type { FSWatcher } from "chokidar";
import { Collection } from "@/collections";
import type * as Vite from "vite";
import type { NextConfig } from "next";
import type { LoadHook } from "node:module";
import { CodeGenerator } from "@/utils/code-generator";
import type { Awaitable } from "@/types";
import type { GlobalConfig } from "./config";

export interface ResolvedConfig extends Omit<GlobalConfig, "collections"> {
  collections: Map<string, Collection>;
}

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

  /** when `true`, only keep the last plugin with same `name`. */
  dedupe?: boolean;

  /**
   * on config loaded/updated
   */
  config?: (this: PluginContext, config: ResolvedConfig) => Awaitable<void | ResolvedConfig>;

  /**
   * called after collection initialization
   */
  collection?: (this: PluginContext, collection: Collection) => Awaitable<void>;

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

export type CoreOptions = Partial<ResolvedCoreOptions>;

/**
 * the resolved options, all paths are absolute
 */
export interface ResolvedCoreOptions {
  cwd: string;
  configPath: string;
  outDir: string;
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
   * filter the collections to run emit
   */
  filterCollection?: (collection: Collection) => boolean;

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
  async function load(pluginOptions: PluginOption[]): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    for (const option of await Promise.all(pluginOptions)) {
      if (!option) continue;
      if (Array.isArray(option)) plugins.push(...(await load(option)));
      else plugins.push(option);
    }
    return plugins;
  }

  let plugins: Plugin[] = [];
  for (const plugin of await load(pluginOptions)) {
    if (plugin.dedupe) plugins = plugins.filter((other) => other.name !== plugin.name);
    plugins.push(plugin);
  }

  return plugins;
}

export class Core {
  private readonly workspaces = new Map<string, Core>();
  private readonly options: ResolvedCoreOptions;
  private plugins: Plugin[] = [];
  private config!: ResolvedConfig;
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

  constructor(options: CoreOptions = {}) {
    const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
    this.options = {
      ...options,
      cwd,
      outDir: path.resolve(cwd, options.outDir ?? Core.defaultOptions.outDir),
      configPath: path.resolve(cwd, options.configPath ?? Core.defaultOptions.configPath),
    };
  }

  async init({
    config: newConfig,
    plugins: customPlugins,
  }: {
    /**
     * either the default export or all exports of config file.
     */
    config: Awaitable<Record<string, unknown>>;
    plugins?: PluginOption;
  }) {
    this.config = await this.initConfig(await newConfig);
    this.cache.clear();
    this.workspaces.clear();
    this.plugins = await getPlugins([
      customPlugins,
      this.config.plugins,
      ...this.config.collections.values().map((collection) => collection.plugins),
    ]);

    const ctx = this.getPluginContext();
    for (const plugin of this.plugins) {
      const out = await plugin.config?.call(ctx, this.config);
      if (out) this.config = out;
    }

    await Promise.all(
      this.config.collections.values().map(async (collection) => {
        await collection.onConfig.run({ collection, core: this, config: this.config });

        for (const plugin of this.plugins) {
          await plugin.collection?.call(ctx, collection);
        }
      }),
    );

    // only support workspaces with max depth 1
    if (!this.options.workspace && this.config.workspaces) {
      await Promise.all(
        Object.entries(this.config.workspaces).map(async ([name, workspace]) => {
          const child = new Core({
            ...this.options,
            cwd: path.resolve(this.options.cwd, workspace.dir),
            workspace: {
              name,
              parent: this,
              dir: workspace.dir,
            },
          });

          await child.init({ config: workspace.config as Record<string, unknown> });
          this.workspaces.set(name, child);
        }),
      );
    }
  }

  getWorkspaces() {
    return this.workspaces;
  }
  getOptions() {
    return this.options;
  }
  getConfig(): ResolvedConfig {
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
    for (const collection of this.getCollections()) {
      promises.push(collection.onServer.run({ collection, core: this, server }));
    }
    for (const workspace of this.workspaces.values()) {
      promises.push(workspace.initServer(server));
    }

    await Promise.all(promises);
  }

  async emit(emitOptions: EmitOptions = {}): Promise<EmitOutput> {
    const { workspace, outDir } = this.options;
    const { target, jsExtension } = this.config.emit ?? {};
    const { filterCollection, filterWorkspace, write = false } = emitOptions;
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

    for (const entries of await Promise.all(
      this.getCollections().map((collection) => {
        if (filterCollection && !filterCollection(collection)) return null;
        return collection.onEmit.run([], ctx);
      }),
    )) {
      if (!entries) continue;
      for (const item of entries) {
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

  /**
   * convert absolute path into a runtime path (relative to **runtime** cwd)
   */
  _toRuntimePath(absolutePath: string) {
    return path.relative(process.cwd(), absolutePath);
  }

  private async initConfig(config: Record<string, unknown>): Promise<ResolvedConfig> {
    const collections = new Map<string, Collection>();
    let globalConfig: GlobalConfig;

    if ("default" in config) {
      globalConfig = config.default as GlobalConfig;
      for (const [k, v] of Object.entries(config)) {
        if (v instanceof Collection) {
          globalConfig.collections ??= {};
          globalConfig.collections[k] = v;
        }
      }
    } else {
      globalConfig = config as GlobalConfig;
    }

    globalConfig.collections ??= {};
    await Promise.all(
      Object.entries(globalConfig.collections).map(async ([name, collection]) => {
        collection.name = name;
        collections.set(name, collection);
        await collection.onInit.run({ collection, core: this });
      }),
    );
    return {
      ...globalConfig,
      collections,
    };
  }
}
