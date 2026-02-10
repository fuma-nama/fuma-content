```ts title="docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter";
import { frontmatter as __1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter";
export const docs = mdxStoreLazy<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-index",{ head: {"index.mdx": __0,"folder/test.mdx": __1,}, body: {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"),} });
```

```ts title="docs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config,"docs",unknown>("docs",{"index.mdx": () => import("./generate-index/index.mdx?collection=docs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"),});
```

```ts title="blogs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __0 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter";
import { frontmatter as __1 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter";
import { type LinkReference } from "fuma-content/collections/mdx";
export const blogs = mdxStoreLazy<typeof Config,"blogs",unknown & { /** extracted link references (e.g. hrefs, paths), useful for analyzing relationships between pages. */ _linkReferences: LinkReference[] }>("blogs","packages/fuma-content/test/fixtures/generate-index",{ head: {"index.mdx": __0,"folder/test.mdx": __1,}, body: {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"),} });
```

```ts title="blogs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
import { type LinkReference } from "fuma-content/collections/mdx";
export const blogs = mdxStoreBrowser<typeof Config,"blogs",unknown & { /** extracted link references (e.g. hrefs, paths), useful for analyzing relationships between pages. */ _linkReferences: LinkReference[] }>("blogs",{"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"),});
```