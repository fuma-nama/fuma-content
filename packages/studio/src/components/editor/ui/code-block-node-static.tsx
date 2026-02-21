import type { TCodeBlockElement } from "platejs";

import {
  type SlateElementProps,
  type SlateLeafProps,
  SlateElement,
  SlateLeaf,
} from "platejs/static";

export function CodeBlockElementStatic(props: SlateElementProps<TCodeBlockElement>) {
  return (
    <SlateElement className="hljs py-1" {...props}>
      <div className="relative rounded-md bg-muted/50">
        <pre className="overflow-x-auto p-8 pr-4 font-mono text-sm leading-normal [tab-size:2] print:break-inside-avoid">
          <code>{props.children}</code>
        </pre>
      </div>
    </SlateElement>
  );
}

export function CodeLineElementStatic(props: SlateElementProps) {
  return <SlateElement {...props} />;
}

export function CodeSyntaxLeafStatic(props: SlateLeafProps) {
  const tokenClassName = props.leaf.className as string;

  return <SlateLeaf className={tokenClassName} {...props} />;
}
