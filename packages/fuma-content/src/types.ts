import type { GlobalConfig } from "@/config";
import type { Collection, CollectionHandlers } from "@/collections";

// `Config` should be an object of all exports in config file.
export type GetCollectionConfig<Config, Name extends string> =
  Config extends Record<Name, Collection>
    ? Config[Name]
    : Config extends {
          default: GlobalConfig<infer Collections>;
        }
      ? Collections[Name]
      : never;

export type Awaitable<T> = T | PromiseLike<T>;

export interface CollectionWithHandler<
  HandlerName extends keyof CollectionHandlers,
> extends Collection {
  readonly handlers: RequireProps<Collection["handlers"], HandlerName>;
}

type RequireProps<T, K extends keyof T> = {
  [P in K]-?: T[P];
};
