type Awaitable<T> = T | PromiseLike<T>;

export interface CollectionStore<Id, Data> {
  /**
   * type-only operation to change data type, doesn't do any runtime transformation.
   */
  $data: <T>(_cast: (input: Data) => T) => CollectionStore<Id, T>;

  get: (id: Id) => Awaitable<Data | undefined>;
  list: () => Awaitable<Data[]>;

  /**
   * For typescript to infer data types, can be anything
   */
  $inferData: Data;
}

export class SimpleCollectionStore<Data> implements CollectionStore<
  string,
  Data
> {
  private readonly dataMap: Map<string, Data>;
  private readonly dataList: Data[];

  constructor(input: Map<string, Data>) {
    this.dataMap = input;
    this.dataList = Array.from(input.values());
  }

  get(id: string): Data | undefined {
    return this.dataMap.get(id);
  }

  list(): Data[] {
    return this.dataList;
  }

  $data<T>(_cast: (input: Data) => T): SimpleCollectionStore<T> {
    return this as unknown as SimpleCollectionStore<T>;
  }

  /**
   * in-place transformation on all data
   */
  transform<T>(fn: (input: Data) => T): SimpleCollectionStore<T> {
    this.dataList.length = 0;
    const dataMap = this.dataMap as unknown as Map<string, T>;
    const dataList = this.dataList as unknown as T[];

    for (const [k, v] of this.dataMap) {
      const updated = fn(v);
      dataMap.set(k, updated);
      dataList.push(updated);
    }

    return this as unknown as SimpleCollectionStore<T>;
  }

  get $inferData(): Data {
    throw new Error("compile-time only");
  }
}
