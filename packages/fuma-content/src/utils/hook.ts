import type { Awaitable } from "@/types";

export interface Hook<Context = undefined> {
  /**
   * add a hook
   *
   * @returns the same pipe instance
   */
  hook: (fn: (context: Context) => void) => Hook<Context>;
  run: (context: Context) => void;
  $inferHandler: (context: Context) => Awaitable<void>;
}

export interface AsyncHook<Context = undefined> {
  /**
   * add a hook
   *
   * @returns the same pipe instance
   */
  hook: (fn: (context: Context) => Awaitable<void>) => AsyncHook<Context>;
  run: (context: Context) => Awaitable<void>;
  $inferHandler: (context: Context) => Awaitable<void>;
}

export function hook<Context>(steps: ((ctx: Context) => void)[] = []): Hook<Context> {
  return {
    async run(ctx) {
      for (const step of steps) step(ctx);
    },
    hook(fn) {
      steps.push(fn);
      return this;
    },
    $inferHandler: undefined as never,
  };
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
    $inferHandler: undefined as never,
  };
}
