export function isPromiseLike(v: unknown): v is PromiseLike<unknown> {
  return typeof v === "object" && v !== null && "then" in v && typeof v.then === "function";
}
