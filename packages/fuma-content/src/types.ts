import type { CollectionsPack, GlobalConfig } from "@/config";
import type { Collection } from "./collections";

type OrFallback<T, Fallback> = [T] extends [never] ? Fallback : T;

// `Config` should be an object of all exports in config file.
export type GetCollectionConfig<Config, Name extends string> =
  Omit<Config, "default"> extends CollectionsPack
    ? OrFallback<
        Resolve<Omit<Config, "default">, Name>,
        Config extends {
          default: GlobalConfig<infer Collections>;
        }
          ? Resolve<Collections, Name>
          : never
      >
    : never;

type Resolve<Map extends CollectionsPack, Name extends string> = Map[Name] extends Collection
  ? Map[Name]
  : Map[Name] extends { index: Collection }
    ? Map[Name]["index"]
    : Name extends `${infer Key}$${infer Property}`
      ? Map[Key] extends CollectionsPack
        ? Resolve<Map[Key], Property>
        : never
      : never;

export type Awaitable<T> = T | PromiseLike<T>;
