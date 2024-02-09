import {Fragment as _Fragment, jsx as _jsx} from "react/jsx-runtime";
export const lastModified = undefined;
export const frontmatter = {};
import alias from "@/alias";
import under from "D:/dev/frameworks/fuma-content/packages/fuma-content/test/fixtures/index.mdx";
import parent from "D:/dev/frameworks/fuma-content/packages/fuma-content/test/index.test.ts";
function _createMdxContent(props) {
  return _jsx(_Fragment, {
    children: console.log(alias, under, parent)
  });
}
export default function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? _jsx(MDXLayout, {
    ...props,
    children: _jsx(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}
