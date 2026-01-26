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

```ts title="docs.dynamic.ts"
// @ts-nocheck
import * as Config from "./config";
import { mdxStoreDynamic } from "fuma-content/collections/mdx/runtime-dynamic";
import * as _jsx_runtime from "react/jsx-runtime";
import { frontmatter as __0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter";
import { frontmatter as __1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter";
export const docs = mdxStoreDynamic<typeof Config,"docs",unknown>(Config,{"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":""},"docs","packages/fuma-content/test/fixtures/generate-index",{"index.mdx": __0,"folder/test.mdx": __1,},_jsx_runtime);
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

```ts title="test/docs.dynamic.ts"
// @ts-nocheck
import * as Config from "./config";
import { mdxStoreDynamic } from "fuma-content/collections/mdx/runtime-dynamic";
import * as _jsx_runtime from "react/jsx-runtime";
import { frontmatter as __0 } from "./generate-index-2/index.mdx?collection=docs&only=frontmatter&workspace=test";
import { frontmatter as __1 } from "./generate-index-2/test/test.mdx?collection=docs&only=frontmatter&workspace=test";
export const docs = mdxStoreDynamic<typeof Config,"docs",unknown>(Config,{"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":"packages/fuma-content/test/fixtures/generate-index-2"},"docs","packages/fuma-content/test/fixtures/generate-index-2",{"index.mdx": __0,"test/test.mdx": __1,},_jsx_runtime);
```