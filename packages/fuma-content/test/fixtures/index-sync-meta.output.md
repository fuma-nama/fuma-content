```ts title="meta.ts"
// @ts-nocheck
import { metaStore } from "fuma-content/collections/meta/runtime";
import type * as Config from "./config";
import { default as __fd_glob_0 } from "./generate-index/meta.json?collection=docs"
export const docs = metaStore<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index", {"meta.json": __fd_glob_0, });
```