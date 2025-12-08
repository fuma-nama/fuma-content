export class CollectionListGenerator {
  private readonly current: string[];

  constructor(initializer: string) {
    this.current = [initializer];
  }

  composer(fn: string) {
    this.current.push(`.composer(${fn})`);
  }

  flush() {
    this.current.push(".build()");
    return this.current.join("");
  }
}
