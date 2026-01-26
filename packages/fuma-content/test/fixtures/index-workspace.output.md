```ts title="docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStore } from "fuma-content/collections/mdx/runtime";
import * as __0 from "./generate-index/index.mdx?collection=docs";
import * as __1 from "./generate-index/folder/test.mdx?collection=docs";
export const docs = mdxStore<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __0,"folder/test.mdx": __1,});
```

```ts title="docs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config,"docs",unknown>("docs",{"index.mdx": () => import("./generate-index/index.mdx?collection=docs"),"folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"),});
```

```ts title="test/docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __0 } from "./generate-index-2/index.mdx?collection=docs&only=frontmatter&workspace=test";
import { frontmatter as __1 } from "./generate-index-2/test/test.mdx?collection=docs&only=frontmatter&workspace=test";
export const docs = mdxStoreLazy<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-index-2",{ head: {"index.mdx": __0,"test/test.mdx": __1,}, body: {"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"),"test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"),} });
```

```ts title="test/docs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config,"docs",unknown>("docs",{"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"),"test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"),});
```