import type { NextConfig } from "next";
import type * as webpack from "webpack";
import type {
  NextJsWebpackConfig,
  WebpackConfigContext,
} from "next/dist/server/config-shared";
import { defaultConfig } from "fuma-content/internal";
import { type NextPluginOptions, runBeforeWebpackCompile } from "./events";

const devServerStartedRef = { current: false };

export const createContentPlugin =
  (pluginOptions: NextPluginOptions = defaultConfig) =>
  (nextConfig: Partial<NextConfig> = {}): Partial<NextConfig> => {
    return {
      ...nextConfig,
      webpack(config: webpack.Configuration, options: WebpackConfigContext) {
        config.plugins ||= [];
        config.plugins.push(new ContentWebpackPlugin(pluginOptions));

        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(config, options) as NextJsWebpackConfig;
        }

        return config;
      },
    };
  };

export const withContent = ({
  content,
  ...config
}: Partial<NextConfig & { content: NextPluginOptions }>): NextConfig => {
  return createContentPlugin(content)(config);
};

class ContentWebpackPlugin {
  constructor(readonly pluginOptions: NextPluginOptions) {}

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.beforeCompile.tapPromise(
      ContentWebpackPlugin.name,
      async () => {
        await runBeforeWebpackCompile({
          pluginOptions: this.pluginOptions,
          devServerStartedRef,
          mode: compiler.options.mode,
        });
      }
    );
  }
}
