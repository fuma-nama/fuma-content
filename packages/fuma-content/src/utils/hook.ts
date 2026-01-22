import type { Awaitable } from "@/types";

export interface AsyncHook<Context = undefined> {
  /**
   * add a hook
   *
   * @returns the same pipe instance
   */
  hook: (fn: (context: Context) => Awaitable<void>) => AsyncHook<Context>;
  run: (context: Context) => Awaitable<void>;
}

export function asyncHook<Context>(
  steps: ((ctx: Context) => Awaitable<void>)[] = [],
): AsyncHook<Context> {
  return {
    async run(ctx) {
      await Promise.all(steps.map((step) => step(ctx)));
    },
    hook(fn) {
      steps.push(fn);
      return this;
    },
  };
}
