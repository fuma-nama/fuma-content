export class CollectionList<Data> {
  data: Data;
  constructor(input: Data) {
    this.data = input;
  }

  composer<T>(composer: (input: Data) => T): CollectionList<T> {
    const data = this.data;
    const updated = this as unknown as CollectionList<T>;
    updated.data = composer(data);
    return updated;
  }

  build(): Data {
    return this.data;
  }
}

export function list<T>(input: T) {
  return new CollectionList(input);
}
