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
   * in-place transformation on all data
   */
  transform<T>(fn: (input: Data) => T): MapCollectionStore<Id, T> {
    this.dataList.length = 0;
    const dataMap = this.dataMap as unknown as Map<Id, T>;
    const dataList = this.dataList as unknown as T[];

    for (const [k, v] of this.dataMap) {
      const updated = fn(v);
      dataMap.set(k, updated);
      dataList.push(updated);
    }

    return this as unknown as MapCollectionStore<Id, T>;
  }

  get $inferData(): Data {
    return undefined as Data;
  }
}
