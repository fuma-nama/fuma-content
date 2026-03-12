import type { Pluggable, Plugin } from "unified";

export function pluggable<PluginParameters extends unknown[]>(
  plugin: Plugin<PluginParameters, any, any>,
  ...params: PluginParameters
): Pluggable {
  return [plugin, ...params];
}
