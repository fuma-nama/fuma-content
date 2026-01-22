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

```ts title="test/docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { mdxStoreLazy } from "fuma-content/collections/mdx/runtime";
import { frontmatter as __fd_glob_1 } from "./generate-index-2/test/test.mdx?collection=docs&only=frontmatter&workspace=test"
import { frontmatter as __fd_glob_0 } from "./generate-index-2/index.mdx?collection=docs&only=frontmatter&workspace=test"
export const docs = mdxStoreLazy<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-index-2",{ head: {"index.mdx": __fd_glob_0, "test/test.mdx": __fd_glob_1, }, body: {"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"), "test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"), } });
```

```ts title="test/docs.browser.ts"
// @ts-nocheck
import { mdxStoreBrowser } from "fuma-content/collections/mdx/runtime-browser";
import type * as Config from "./config";
export { useRenderer } from "fuma-content/collections/mdx/runtime-browser";
export const docs = mdxStoreBrowser<typeof Config,"docs",unknown>("docs",{"index.mdx": () => import("./generate-index-2/index.mdx?collection=docs&workspace=test"), "test/test.mdx": () => import("./generate-index-2/test/test.mdx?collection=docs&workspace=test"), });
```

```ts title="test/docs.dynamic.ts"
// @ts-nocheck
import * as Config from "./config";
import { mdxStoreDynamic } from "fuma-content/collections/mdx/runtime-dynamic";
import { frontmatter as __fd_glob_1 } from "./generate-index-2/test/test.mdx?collection=docs&only=frontmatter&workspace=test"
import { frontmatter as __fd_glob_0 } from "./generate-index-2/index.mdx?collection=docs&only=frontmatter&workspace=test"
export const docs = mdxStoreDynamic<typeof Config,"docs",unknown>(Config,{"configPath":"packages/fuma-content/test/fixtures/config.ts","outDir":"packages/fuma-content/test/fixtures","cwd":"packages/fuma-content/test/fixtures/generate-index-2","workspace":{"name":"test","parent":{"workspaces":{},"options":{"configPath":"/Users/xred/dev/fuma-content/packages/fuma-content/test/fixtures/config.ts","outDir":"/Users/xred/dev/fuma-content/packages/fuma-content/test/fixtures","cwd":"/Users/xred/dev/fuma-content"},"plugins":[],"config":{"collections":{},"workspaces":{"test":{"dir":"/Users/xred/dev/fuma-content/packages/fuma-content/test/fixtures/generate-index-2","config":{"collections":{"docs":{"pluginHooks":{},"name":"docs","onConfig":{},"onInit":{},"onEmit":{},"onServer":{},"plugins":[],"dir":"/Users/xred/dev/fuma-content/packages/fuma-content/test/fixtures/generate-index-2","patterns":["**/*.{md,mdx}"],"supportedFormats":["md","mdx"],"dynamic":false,"lazy":true,"frontmatter":{},"vfile":{},"storeInitializer":{}}}}}}},"cache":{}},"dir":"/Users/xred/dev/fuma-content/packages/fuma-content/test/fixtures/generate-index-2"}},"docs","packages/fuma-content/test/fixtures/generate-index-2",{"index.mdx": __fd_glob_0, "test/test.mdx": __fd_glob_1, });
```