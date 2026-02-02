import type { Awaitable } from "@/types";

export interface CollectionStore<Id, Data> {
  /**
   * type-only operation to cast data type, doesn't do any runtime transformation.
   */
  castData: <T>(_cast: (input: Data) => T) => CollectionStore<Id, T>;

  get: (id: Id) => Awaitable<Data | undefined>;
  list: () => Awaitable<Data[]>;

  /**
   * For typescript to infer data types, don't access the value of this property.
   */
  $inferData: Data;
}

export class MapCollectionStore<Id, Data> implements CollectionStore<Id, Data> {
  private readonly dataMap: Map<Id, Data>;
  private readonly dataList: Data[];

  constructor(input: Map<Id, Data>) {
    this.dataMap = input;
    this.dataList = Array.from(input.values());
  }

  get(id: Id): Data | undefined {
    return this.dataMap.get(id);
  }

  list(): Data[] {
    return this.dataList;
  }

  castData<T>(_cast: (input: Data) => T): MapCollectionStore<Id, T> {
    return this as unknown as MapCollectionStore<Id, T>;
  }

  /**
   * transform entry and create a new store
   */
  transform<$Id, T>(fn: (id: Id, data: Data) => [$Id, T]): MapCollectionStore<$Id, T> {
    const updated = new Map<$Id, T>();

    for (const [k, v] of this.dataMap) {
      const out = fn(k, v);
      updated.set(out[0], out[1]);
    }

    return new MapCollectionStore(updated);
  }

  get $inferData(): Data {
    return undefined as Data;
  }
}
