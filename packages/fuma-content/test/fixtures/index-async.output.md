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
import { mdxStoreLazy, type WithExtractedReferences } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __0 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter";
import { frontmatter as __1 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter";
export const blogs = mdxStoreLazy<typeof Config,"blogs",unknown & WithExtractedReferences>("blogs","packages/fuma-content/test/fixtures/generate-index",{ head: {"index.mdx": __0,"folder/test.mdx": __1,}, body: {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"),} });
```

```ts title="blogs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser, type WithExtractedReferences } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const blogs = mdxStoreBrowser<typeof Config,"blogs",unknown & WithExtractedReferences>("blogs",{"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"),});
```