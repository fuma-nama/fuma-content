```ts title="docs.ts"
// @ts-nocheck
import { dataStore } from "fuma-content/collections/data/runtime";
import type * as Config from "./config";
import { default as __0 } from "./generate-index/meta.json?collection=docs";
export const docs = dataStore<typeof Config, "docs">("docs", "packages/fuma-content/test/fixtures/generate-index", {"meta.json": __0,});
```