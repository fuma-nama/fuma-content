import { createPlatePlugin } from "platejs/react";
import { MdxComponent, UnknownNodeComponent } from "../ui/mdx-component-node";

export const ELEMENT_MDX_COMPONENT = "mdx-component" as const;
export const ELEMENT_UNKNOWN_NODE = "unknown-md-node" as const;

const MdxComponentPlugin = createPlatePlugin({
  key: ELEMENT_MDX_COMPONENT,
  node: {
    isElement: true,
    isContainer: true,
  },
  render: {
    node: MdxComponent,
  },
});

const UnknownNodePlugin = createPlatePlugin({
  key: ELEMENT_UNKNOWN_NODE,
  node: {
    isVoid: true,
    isElement: true,
  },
  render: {
    node: UnknownNodeComponent,
  },
});

export const MdxComponentKit = [MdxComponentPlugin, UnknownNodePlugin];

export function isPropValueSupported(value: unknown) {
  return (
    typeof value === "string" || typeof value === "number" || value === null || value === undefined
  );
}
