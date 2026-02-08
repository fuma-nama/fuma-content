import { createPlatePlugin } from "platejs/react";
import { MdxComponent } from "../ui/mdx-component-node";

export const ELEMENT_MDX_COMPONENT = "mdx-component";

export const MdxComponentKit = createPlatePlugin({
  key: ELEMENT_MDX_COMPONENT,
  node: {
    isElement: true,
    isContainer: true,
  },
  render: {
    node: MdxComponent,
  },
});
