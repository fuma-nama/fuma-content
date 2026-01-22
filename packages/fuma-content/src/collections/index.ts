import { Core, EmitContext, EmitEntry, PluginOption, ResolvedConfig, ServerContext } from "@/core";
import { asyncHook, hook } from "@/utils/hook";
import { asyncPipe } from "@/utils/pipe";

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
  readonly onConfig = hook<CollectionHookContext & { config: ResolvedConfig }>();
  /**
   * Configure watch/dev server
   */
  readonly onServer = hook<CollectionHookContext & { server: ServerContext }>();
  readonly onInit = asyncHook<CollectionHookContext>();
  readonly onEmit = asyncPipe<EmitEntry[], EmitContext>();
  readonly plugins: PluginOption[] = [];

  transform(transformer: (collection: this) => void): this {
    transformer(this);
    return this;
  }

  pluginHook<T, Options>(hook: CollectionHook<T, Options>, options: Options): T;
  pluginHook<T>(hook: CollectionHook<T>): T;

  pluginHook<T, O>(hook: CollectionHook<T, O>, options?: O): T {
    let created = this.pluginHooks.get(hook.id) as T | undefined;
    if (created) return created;

    created = hook.create(this, options as O);
    this.pluginHooks.set(hook.id, created);
    return created;
  }

  getPluginHook<T>(hook: CollectionHook<T>): T | undefined {
    return this.pluginHooks.get(hook.id) as T | undefined;
  }
}

export interface CollectionHook<T = unknown, Options = undefined> {
  id: symbol;
  create: (collection: Collection, options: Options) => T;
}

export function defineCollectionHook<T, Options = undefined>(
  init: (collection: Collection, options: Options) => T,
): CollectionHook<T, Options> {
  return {
    id: Symbol(),
    create: init,
  };
}
