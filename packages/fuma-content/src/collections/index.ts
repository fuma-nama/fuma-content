import { Core, EmitContext, EmitEntry, PluginOption, ResolvedConfig, ServerContext } from "@/core";
import { asyncHookPipe, asyncPipe } from "@/utils/pipe";

export interface CollectionHookContext {
  core: Core;
  collection: Collection;
}

export class Collection {
  private readonly pluginHooks = new Map<symbol, unknown>();
  name = null as unknown as string;

  /**
   * on config loaded/updated
   */
  readonly onConfig = asyncPipe<ResolvedConfig, CollectionHookContext>();
  readonly onInit = asyncHookPipe<CollectionHookContext>();
  readonly onEmit = asyncPipe<EmitEntry[], EmitContext>();
  readonly plugins: PluginOption[] = [];
  /**
   * Configure Fumadocs dev server
   */
  readonly onServer = asyncHookPipe<CollectionHookContext & { server: ServerContext }>();

  transform(transformer: (collection: this) => void): this {
    transformer(this);
    return this;
  }

  pluginHook<T>(hook: CollectionHook<T>, init?: T): T {
    let created = this.pluginHooks.get(hook.id) as T | undefined;
    if (created) return created;

    created = init ?? hook.create(this);
    this.pluginHooks.set(hook.id, created);
    return created;
  }

  getPluginHook<T>(hook: CollectionHook<T>): T | undefined {
    return this.pluginHooks.get(hook.id) as T | undefined;
  }
}

export interface CollectionHook<T = unknown> {
  id: symbol;
  create: (collection: Collection) => T;
}

export function defineCollectionHook<T>(init: (collection: Collection) => T): CollectionHook<T> {
  return {
    id: Symbol(),
    create: init,
  };
}
