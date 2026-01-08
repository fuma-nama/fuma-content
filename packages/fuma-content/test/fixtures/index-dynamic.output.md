```ts title="mdx.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStore, $extractedReferences } from "fuma-content/collections/mdx/runtime";
import * as __fd_glob_3 from "./generate-index/folder/test.mdx?collection=blogs"
import * as __fd_glob_2 from "./generate-index/index.mdx?collection=blogs"
import * as __fd_glob_1 from "./generate-index/folder/test.mdx?collection=docs"
import * as __fd_glob_0 from "./generate-index/index.mdx?collection=docs"
export const docs = mdxStore<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
export const blogs = mdxStore<typeof Config, "blogs">("blogs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_2, "folder/test.mdx": __fd_glob_3, }).$data($extractedReferences());
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
import * as Config from "./config";
import { mdxStoreDynamic, $extractedReferences } from "fuma-content/collections/mdx/runtime-dynamic";
import { frontmatter as __fd_glob_3 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_2 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter"
export const docs = mdxStoreDynamic<typeof Config, "docs">(Config, {"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":""}, "docs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
export const blogs = mdxStoreDynamic<typeof Config, "blogs">(Config, {"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":""}, "blogs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_2, "folder/test.mdx": __fd_glob_3, }).$data($extractedReferences());
```