import { createPlatePlugin } from "platejs/react";
import { MdxComponent, UnknownNodeComponent } from "../ui/mdx-component-node";
import { ELEMENT_MDX_COMPONENT, ELEMENT_UNKNOWN_NODE } from "../types";

const MdxComponentPlugin = createPlatePlugin({
  key: ELEMENT_MDX_COMPONENT,
  node: {
    isElement: true,
    isContainer: true,
  },
  render: {
    node: MdxComponent,
  },
  rules: {
    break: {
      default: "lineBreak",
    },
    delete: {
      empty: "reset",
    },
    selection: {
      affinity: "directional",
    },
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
  rules: {
    break: {
      default: "exit",
    },
    selection: {
      affinity: "directional",
    },
  },
});

export const MdxComponentKit = [MdxComponentPlugin, UnknownNodePlugin];
