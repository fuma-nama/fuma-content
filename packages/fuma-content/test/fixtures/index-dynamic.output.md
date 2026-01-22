```ts title="docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStore } from "fuma-content/collections/mdx/runtime";
import * as __fd_glob_1 from "./generate-index/folder/test.mdx?collection=docs"
import * as __fd_glob_0 from "./generate-index/index.mdx?collection=docs"
export const docs = mdxStore<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
```

```ts title="docs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
export const docs = mdxStoreBrowser<typeof Config,"docs",unknown>("docs",{"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), });
```

```ts title="docs.dynamic.ts"
// @ts-nocheck
import * as Config from "./config";
import { mdxStoreDynamic } from "fuma-content/collections/mdx/runtime-dynamic";
import { frontmatter as __fd_glob_1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter"
export const docs = mdxStoreDynamic<typeof Config,"docs",unknown>(Config,{"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":""},"docs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
```

```ts title="blogs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStore, type WithExtractedReferences } from "fuma-content/collections/mdx/runtime";
import * as __fd_glob_1 from "./generate-index/folder/test.mdx?collection=blogs"
import * as __fd_glob_0 from "./generate-index/index.mdx?collection=blogs"
export const blogs = mdxStore<typeof Config,"blogs",unknown & WithExtractedReferences>("blogs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
```

```ts title="blogs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser, type WithExtractedReferences } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
export const blogs = mdxStoreBrowser<typeof Config,"blogs",unknown & WithExtractedReferences>("blogs",{"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"), });
```

```ts title="blogs.dynamic.ts"
// @ts-nocheck
import * as Config from "./config";
import { mdxStoreDynamic, type WithExtractedReferences } from "fuma-content/collections/mdx/runtime-dynamic";
import { frontmatter as __fd_glob_1 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_0 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter"
export const blogs = mdxStoreDynamic<typeof Config,"blogs",unknown & WithExtractedReferences>(Config,{"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":""},"blogs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, });
```