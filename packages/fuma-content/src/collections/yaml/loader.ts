import type { Loader } from "@/plugins/loader";
import { load } from "js-yaml";
import type { DynamicCore } from "@/dynamic";
import { createDataLoader } from "../data/loader";

export function createYamlLoader(core: DynamicCore): Loader {
  return createDataLoader(core, (filePath, source) => {
    try {
      return load(source) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`invalid data in ${filePath}`, { cause: e });
    }
  });
}
