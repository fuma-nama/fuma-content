import type { LoadFnOutput, LoadHook } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import type { Loader } from "@/plugins/with-loader";

export function toNode(loaders: { test: RegExp | undefined; loader: Loader }[]): LoadHook {
  return async (url, _context, nextLoad): Promise<LoadFnOutput> => {
    if (!url.startsWith("file:///")) return nextLoad(url);

    const config = loaders.find((loader) => !loader.test || loader.test.test(url));
    if (config) {
      const parsedUrl = new URL(url);
      const filePath = fileURLToPath(parsedUrl);

      const result = await config.loader.load({
        filePath,
        query: Object.fromEntries(parsedUrl.searchParams.entries()),
        async getSource() {
          return (await fs.readFile(filePath)).toString();
        },
        development: false,
        compiler: {
          addDependency() {},
        },
      });

      if (result) {
        return {
          source: result.code,
          format: "module",
          shortCircuit: true,
        };
      }
    }

    return nextLoad(url);
  };
}
