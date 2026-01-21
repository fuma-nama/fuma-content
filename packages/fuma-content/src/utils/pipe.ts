import type { Awaitable } from "@/types";

export interface Pipe<Data, Context = undefined> {
  /**
   * add a transformation step
   *
   * @returns the same pipe instance
   */
  pipe: (fn: (data: Data, context: Context) => Data) => Pipe<Data, Context>;
  run: (data: Data, context: Context) => Data;
  clone: () => Pipe<Data, Context>;
}

export interface AsyncPipe<Data, Context = undefined> {
  /**
   * add a transformation step
   *
   * @returns the same pipe instance
   */
  pipe: (fn: (data: Data, context: Context) => Awaitable<Data>) => AsyncPipe<Data, Context>;
  run: (data: Data, context: Context) => Awaitable<Data>;
  clone: () => AsyncPipe<Data, Context>;
}

export function pipe<Data, Context>(
  steps: ((data: Data, context: Context) => Data)[] = [],
): Pipe<Data, Context> {
  return {
    run(data, ctx) {
      for (const step of steps) {
        data = step(data, ctx);
      }
      return data;
    },
    pipe(fn) {
      steps.push(fn);
      return this;
    },
    clone() {
      return pipe([...steps]);
    },
  };
}

export function asyncPipe<Data, Context>(
  steps: ((data: Data, context: Context) => Awaitable<Data>)[] = [],
): AsyncPipe<Data, Context> {
  return {
    async run(data, ctx) {
      for (const step of steps) {
        data = await step(data, ctx);
      }
      return data;
    },
    pipe(fn) {
      steps.push(fn);
      return this;
    },
    clone() {
      return asyncPipe([...steps]);
    },
  };
}

export interface AsyncHookPipe<Context = undefined> {
  /**
   * add a hook
   *
   * @returns the same pipe instance
   */
  pipe: (fn: (context: Context) => Awaitable<void>) => AsyncHookPipe<Context>;
  run: (context: Context) => Awaitable<void>;
  clone: () => AsyncHookPipe<Context>;
}

export function asyncHookPipe<Context>(pipe = asyncPipe<void, Context>()): AsyncHookPipe<Context> {
  return {
    run(ctx) {
      return pipe.run(undefined, ctx);
    },
    pipe(fn) {
      pipe.pipe((_, ctx) => fn(ctx));
      return this;
    },
    clone() {
      return asyncHookPipe(pipe.clone());
    },
  };
}
