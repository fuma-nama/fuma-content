import * as path from "node:path";
import { pathToFileURL } from "node:url";
import * as fs from "node:fs";
import type { CreateCompilerOptions } from "../compiler";
import { defaultConfig, defaultConfigPath } from "../constants";

export async function loadConfig(
  configFile = defaultConfigPath
): Promise<CreateCompilerOptions> {
  const configPath = path.resolve(configFile);

  if (!fs.existsSync(configPath)) return defaultConfig;
  const importPath = pathToFileURL(configPath).href;
  const result = (await import(importPath)) as
    | CreateCompilerOptions
    | {
        default: CreateCompilerOptions;
      };

  return "default" in result ? result.default : result;
}
