export class AbortablePromise {
  private res: (() => void) | undefined;
  promise: Promise<void>;

  constructor() {
    this.promise = new Promise((res) => {
      this.res = res;
    });
  }

  abort() {
    this.res?.();
  }
}
