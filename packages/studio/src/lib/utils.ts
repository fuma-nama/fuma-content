import { type ClassNameValue, twMerge } from "tailwind-merge";

type ClassNameValueOrFn<T> = ClassNameValue | ((s: T) => ClassNameValue);

export function cn(...classLists: ClassNameValue[]): string;

export function cn<T>(...classLists: ClassNameValueOrFn<T>[]): (f: T) => string;

export function cn(
  ...classLists: ClassNameValueOrFn<unknown>[]
): string | ((f: unknown) => string) {
  if (classLists.some((l) => typeof l === "function")) {
    return (v) => twMerge(...classLists.map((l) => (typeof l === "function" ? l(v) : l)));
  }

  return twMerge(...(classLists as string[]));
}
