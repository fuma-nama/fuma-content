import type { SourceMap } from "rollup";
import type { PluginOption } from "vite";
import { parse } from "node:querystring";
import type { Loader } from "@/plugins/loader";

export function toVite(name: string, test: RegExp | undefined, loader: Loader): PluginOption {
  return {
    name: `fuma-content:${name}`,
    async transform(value, id) {
      if (test && !test.test(id)) return;

      const [file, query = ""] = id.split("?", 2);
      const result = await loader.load({
        filePath: file,
        query: parse(query),
        getSource() {
          return value;
        },
        development: this.environment.mode === "dev",
        addDependency: (file) => {
          this.addWatchFile(file);
        },
      });

      if (result === null) return null;
      return {
        code: result.code,
        map: result.map as SourceMap,
        moduleType: result.moduleType,
      };
    },
  };
}
