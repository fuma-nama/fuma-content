import { ReactNode, lazy, createElement } from "react";
import { CompiledMDX } from "./build-mdx";
import { MDXStoreBrowserData } from "./runtime-browser";

const renderMap = new Map<
  string,
  {
    renderJSX: () => ReactNode;
    forceOnDemand: boolean;
  }
>();

/**
 * Renders content (loaded lazily).
 *
 * It is recommended to use with `<Suspense />`.
 */
export function useRenderer<Frontmatter, Attached>(
  entry: MDXStoreBrowserData<Frontmatter, Attached> | undefined,
  renderFn: (data: CompiledMDX<Frontmatter> & Attached) => ReactNode,
): ReactNode {
  if (!entry) return null;
  const renderKey = `${entry._store.storeId}:${entry.id}`;
  let renderInfo = renderMap.get(renderKey);

  if (!renderInfo) {
    const OnDemand = lazy(async () => {
      const loaded = await entry.preload();
      return { default: () => renderFn(loaded) };
    });

    renderInfo = {
      forceOnDemand: false,
      renderJSX() {
        const v = entry.preload();
        if (!("then" in v) && !this.forceOnDemand) {
          return renderFn(v);
        }

        // ensure it won't unmount React lazy during re-renders
        this.forceOnDemand = true;
        return createElement(OnDemand);
      },
    };
    renderMap.set(renderKey, renderInfo);
  }

  return renderInfo.renderJSX();
}
