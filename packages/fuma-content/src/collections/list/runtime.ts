export class CollectionList<Data> {
  private data: Data[];
  constructor(input: Data[]) {
    this.data = input;
  }

  composer<T>(composer: (input: Data[]) => T[]): CollectionList<T> {
    this.data = composer(this.data) as unknown as Data[];
    return this as unknown as CollectionList<T>;
  }

  build(): Data[] {
    return this.data;
  }
}

export function list<T>(input: T[]) {
  return new CollectionList(input);
}
