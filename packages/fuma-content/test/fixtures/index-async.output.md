```ts title="mdx.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy, $extractedReferences } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __fd_glob_3 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_2 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter"
export const docs = mdxStoreLazy<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index", { head: {"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, }, body: {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), } });
export const blogs = mdxStoreLazy<typeof Config, "blogs">("blogs", "packages/fuma-content/test/fixtures/generate-index", { head: {"index.mdx": __fd_glob_2, "folder/test.mdx": __fd_glob_3, }, body: {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"), } }).$data($extractedReferences());
```

```ts title="mdx-browser.ts"
// @ts-nocheck
import { mdxStoreBrowser, $extractedReferences } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config, "docs">("docs", {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), });
export const blogs = mdxStoreBrowser<typeof Config, "blogs">("blogs", {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"), }).$data($extractedReferences());
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
```

```ts title="mdx-dynamic.ts"
// @ts-nocheck
```