import { pathToFileURL } from "node:url";
import type { Core } from "@/core";

/**
 * - `true`: compile the config before loading.
 * - `false`: import the config directly (without compiling it).
 * - `skip`: assume the config is already compiled.
 */
export type CompileMode = boolean | "skip";

async function compileConfig(core: Core) {
  const { build } = await import("esbuild");
  const { configPath, outDir } = core.getOptions();

  const transformed = await build({
    entryPoints: [{ in: configPath, out: "content.config" }],
    bundle: true,
    outdir: outDir,
    target: "node22",
    write: true,
    platform: "node",
    format: "esm",
    packages: "external",
    outExtension: {
      ".js": ".mjs",
    },
    allowOverwrite: true,
  });

  if (transformed.errors.length > 0) {
    throw new Error("failed to compile configuration file");
  }
}

/**
 * Load config
 */
export async function loadConfig(
  core: Core,
  compileMode: CompileMode,
): Promise<Record<string, unknown>> {
  if (compileMode === true) await compileConfig(core);

  const url =
    compileMode === false
      ? pathToFileURL(core.getOptions().configPath)
      : pathToFileURL(core.getCompiledConfigPath());
  // always return a new config
  url.searchParams.set("hash", Date.now().toString());

  return import(url.href);
}
