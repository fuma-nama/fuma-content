```ts title="mdx.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStore } from "fuma-content/collections/mdx/runtime";
import * as __fd_glob_1 from "./generate-index/folder/test.mdx?collection=docs"
import * as __fd_glob_0 from "./generate-index/index.mdx?collection=docs"
export const docs = mdxStore<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
```

```ts title="mdx-browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config, "docs">("docs", {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), });
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
```

```ts title="mdx-dynamic.ts"
// @ts-nocheck
```