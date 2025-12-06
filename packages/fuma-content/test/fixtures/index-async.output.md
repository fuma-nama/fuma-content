```ts title="server.ts"
// @ts-nocheck
import { frontmatter as __fd_glob_3 } from "./generate-index/folder/test.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_2 } from "./generate-index/index.mdx?collection=blogs&only=frontmatter"
import { frontmatter as __fd_glob_1 } from "./generate-index/folder/test.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_0 } from "./generate-index/index.mdx?collection=docs&only=frontmatter"
import { server } from 'fuma-content/runtime/server';
import type * as Config from './config';

const create = server<typeof Config, import("fuma-content/runtime/types").InternalTypeConfig & {
  DocData: {
    blogs: {
      /**
       * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
       */
      extractedReferences: import("fuma-content").ExtractedReference[];
    },
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docLazy("docs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_0, "folder/test.mdx": __fd_glob_1, }, {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), });

export const blogs = await create.docLazy("blogs", "packages/fuma-content/test/fixtures/generate-index", {"index.mdx": __fd_glob_2, "folder/test.mdx": __fd_glob_3, }, {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"), });
```

```ts title="dynamic.ts"
// @ts-nocheck
import { dynamic } from 'fuma-content/runtime/dynamic';
import * as Config from './config';

const create = await dynamic<typeof Config, import("fuma-content/runtime/types").InternalTypeConfig & {
  DocData: {
    blogs: {
      /**
       * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
       */
      extractedReferences: import("fuma-content").ExtractedReference[];
    },
  }
}>(Config, {"configPath":"packages/fuma-content/test/fixtures/config.ts","environment":"test","outDir":"packages/fuma-content/test/fixtures"}, {"doc":{"passthroughs":["extractedReferences"]}});
```

```ts title="browser.ts"
// @ts-nocheck
import { browser } from 'fuma-content/runtime/browser';
import type * as Config from './config';

const create = browser<typeof Config, import("fuma-content/runtime/types").InternalTypeConfig & {
  DocData: {
    blogs: {
      /**
       * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
       */
      extractedReferences: import("fuma-content").ExtractedReference[];
    },
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("./generate-index/index.mdx?collection=docs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=docs"), }),
  blogs: create.doc("blogs", {"index.mdx": () => import("./generate-index/index.mdx?collection=blogs"), "folder/test.mdx": () => import("./generate-index/folder/test.mdx?collection=blogs"), }),
};
export default browserCollections;
```