import type { WebpackOptionsNormalized } from "webpack";
import {
  createCompiler,
  type CreateCompilerOptions,
} from "fuma-content/internal";

export type NextPluginOptions = CreateCompilerOptions;

let compilerInitialized = false;

const runDev = async (config: NextPluginOptions): Promise<void> => {
  if (compilerInitialized) return;
  compilerInitialized = true;

  const compiler = await createCompiler(config);
  compiler.watch();
};

const runBuild = async (config: NextPluginOptions): Promise<void> => {
  if (compilerInitialized) return;
  compilerInitialized = true;

  const compiler = await createCompiler(config);
  await compiler.emit();
};

export const runBeforeWebpackCompile = async ({
  mode,
  pluginOptions,
  devServerStartedRef,
}: {
  mode: WebpackOptionsNormalized["mode"];
  pluginOptions: NextPluginOptions;
  devServerStartedRef: { current: boolean };
}): Promise<void> => {
  const isNextDev = mode === "development";
  const isBuild = mode === "production";

  if (isBuild) {
    await runBuild(pluginOptions);
  } else if (isNextDev && !devServerStartedRef.current) {
    devServerStartedRef.current = true;
    void runDev(pluginOptions);
  }
};
