import type { Loader } from "@/plugins/loader";
import type { DynamicCore } from "@/dynamic";
import { createDataLoader } from "../data/loader";

export function createJsonLoader(core: DynamicCore, resolveJson: "json" | "js" = "js"): Loader {
  return createDataLoader(
    core,
    (filePath, source) => {
      try {
        return JSON.parse(source);
      } catch (e) {
        throw new Error(`invalid data in ${filePath}`, { cause: e });
      }
    },
    resolveJson,
  );
}
