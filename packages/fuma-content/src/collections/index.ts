import type { Core, PluginOption } from "@/core";
import { UnionToIntersection } from "@/types";

export interface InitOptions {
  name: string;
  core: Core;
}

export interface Collection<
  Handlers extends Record<string, CollectionHandler> = Record<string, CollectionHandler>,
> {
  name: string;
  init?: (options: InitOptions) => void;
  readonly handlers: Handlers;

  /**
   * plugins to register, registered once for each collection.
   *
   * the plugins inside might need to handle duplication.
   */
  readonly plugins: PluginOption[];
}

export interface CollectionHandler<
  Name extends string = string,
  Requirements extends Record<string, CollectionHandler> = never,
> {
  name: Name;
  requirements: (keyof Requirements)[];
  /**
   * called when initializing collection, notice that the plugins are not loaded at the moment.
   */
  init?: (collection: Collection<Requirements>, ctx: InitOptions) => void;
}

export interface CollectionBuilder<
  Requirements extends Record<string, CollectionHandler>,
  Implements extends Record<string, CollectionHandler>,
> {
  handler<Handler extends CollectionHandler>(
    handler: Handler,
  ): Handler extends CollectionHandler<infer Name, infer $R>
    ? CollectionBuilder<Requirements & $R, Implements & Record<Name, Handler>>
    : never;

  handler<Handlers extends CollectionHandler[]>(
    handlers: Handlers,
  ): Handlers[number] extends CollectionHandler<infer Name, infer $R>
    ? CollectionBuilder<
        Requirements & {
          [K in keyof $R]: $R[K];
        },
        Implements & {
          [K in Name]: Extract<Handlers[number], { name: K }>;
        }
      >
    : never;

  build(): Implements extends Requirements
    ? Collection<Implements>
    : {
        error: "missing handlers";
        implemented: Implements;
        required: Requirements;
      };
}

export function collection(): CollectionBuilder<{}, {}> {
  const requirements = new Set<string>();
  const handlers: Record<string, CollectionHandler> = {};
  const builder = {
    handler(input: CollectionHandler | CollectionHandler[]) {
      if (!Array.isArray(input)) input = [input];
      for (const handler of input) {
        for (const r of handler.requirements) {
          requirements.add(r as string);
        }
        handlers[handler.name] = handler;
      }

      return builder;
    },
    build() {
      for (const r of requirements) {
        if (!(r in handlers)) throw new Error(`missing required handler "${r}"`);
      }

      return {
        name: "",
        init(options) {
          this.name = options.name;
          // lock handlers after initialization
          Object.freeze(this.handlers);
          for (const handler of Object.values(this.handlers)) {
            handler.init?.(this as Collection<never>, options);
          }
        },
        handlers,
        plugins: [],
      } satisfies Collection;
    },
  } as CollectionBuilder<{}, {}>;

  return builder;
}

export function getHandler<Handler extends CollectionHandler>(
  collection: Collection,
  handler: Handler["name"],
) {
  return collection.handlers[handler] as Handler | undefined;
}
