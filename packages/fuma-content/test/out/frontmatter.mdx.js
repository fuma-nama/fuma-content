import {jsx as _jsx} from "react/jsx-runtime";
function _createMdxContent(props) {
  const _components = {
    h1: "h1",
    ...props.components
  };
  return _jsx(_components.h1, {
    children: "Title"
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
