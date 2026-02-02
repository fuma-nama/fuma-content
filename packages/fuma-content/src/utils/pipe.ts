import type { Awaitable } from "@/types";

export interface Pipe<Data, Context = undefined> {
  /**
   * add a transformation step
   *
   * @returns the same pipe instance
   */
  pipe: (fn: (data: Data, context: Context) => Data) => Pipe<Data, Context>;
  run: (data: Data, context: Context) => Data;
  $inferHandler: (data: Data, context: Context) => Data;
}

export interface AsyncPipe<Data, Context = undefined> {
  /**
   * add a transformation step
   *
   * @returns the same pipe instance
   */
  pipe: (fn: (data: Data, context: Context) => Awaitable<Data>) => AsyncPipe<Data, Context>;
  run: (data: Data, context: Context) => Awaitable<Data>;
  $inferHandler: (data: Data, context: Context) => Awaitable<Data>;
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
    $inferHandler: undefined as never,
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
    $inferHandler: undefined as never,
  };
}
