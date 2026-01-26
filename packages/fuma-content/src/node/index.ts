import * as module from "node:module";
import type { LoaderOptions } from "./loader";

export function register(options: LoaderOptions) {
  module.register("./loader.js", import.meta.url, {
    data: options,
  });
}
