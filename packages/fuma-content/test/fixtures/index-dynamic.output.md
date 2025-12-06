```ts title="server.ts"
// @ts-nocheck
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

export const docs = await create.doc("docs", "packages/fuma-content/test/fixtures/generate-index", { absolutePath: path.resolve("packages/fuma-content/test/fixtures/generate-index/index.mdx"), info: {"fullPath":"packages/fuma-content/test/fixtures/generate-index/index.mdx","path":"index.mdx"}, data: {}, hash: "b12f02f44f5ed3318104c095c455e5ee" }, { absolutePath: path.resolve("packages/fuma-content/test/fixtures/generate-index/folder/test.mdx"), info: {"fullPath":"packages/fuma-content/test/fixtures/generate-index/folder/test.mdx","path":"folder/test.mdx"}, data: {}, hash: "d41d8cd98f00b204e9800998ecf8427e" });

export const blogs = await create.doc("blogs", "packages/fuma-content/test/fixtures/generate-index", { absolutePath: path.resolve("packages/fuma-content/test/fixtures/generate-index/index.mdx"), info: {"fullPath":"packages/fuma-content/test/fixtures/generate-index/index.mdx","path":"index.mdx"}, data: {}, hash: "b12f02f44f5ed3318104c095c455e5ee" }, { absolutePath: path.resolve("packages/fuma-content/test/fixtures/generate-index/folder/test.mdx"), info: {"fullPath":"packages/fuma-content/test/fixtures/generate-index/folder/test.mdx","path":"folder/test.mdx"}, data: {}, hash: "d41d8cd98f00b204e9800998ecf8427e" });
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
};
export default browserCollections;
```