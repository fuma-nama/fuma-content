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

```ts title="test/mdx.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __fd_glob_1 } from "./generate-index-2/test/test.mdx?collection=docs&only=frontmatter&workspace=test"
import { frontmatter as __fd_glob_0 } from "./generate-index-2/index.mdx?collection=docs&only=frontmatter&workspace=test"
export const docs = mdxStoreLazy<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index-2", { head: {"index.mdx": __fd_glob_0, "test/test.mdx": __fd_glob_1, }, body: {"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"), "test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"), } });
```

```ts title="test/mdx-browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export const docs = mdxStoreBrowser<typeof Config, "docs">("docs", {"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"), "test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"), });
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
```

```ts title="test/mdx-dynamic.ts"
// @ts-nocheck
```