import { parse } from "node:querystring";
import { readFileSync } from "node:fs";
import type { LoaderInput, Loader, LoaderOutput } from "@/plugins/loader";
import { isPromiseLike } from "@/utils/is-promise-like";

export function toBun(test: RegExp = /.+/, loader: Loader) {
  function toResult(output: LoaderOutput | null): Bun.OnLoadResult {
    // it errors, treat this as an exception
    if (!output) return;

    return {
      contents: output.code,
      loader: output.moduleType ?? "js",
    };
  }

  return (build: Bun.PluginBuilder): void => {
    // avoid using async here, because it will cause dynamic require() to fail
    build.onLoad({ filter: test }, (args) => {
      const [filePath, query = ""] = args.path.split("?", 2);
      const input: LoaderInput = {
        async getSource() {
          return Bun.file(filePath).text();
        },
        query: parse(query),
        filePath,
        development: false,
        compiler: {
          addDependency() {},
        },
      };

      if (loader.bun?.load) {
        return loader.bun.load(readFileSync(filePath).toString(), input);
      }

      const result = loader.load(input);
      if (isPromiseLike(result)) {
        return result.then(toResult);
      }
      return toResult(result);
    });
  };
}
