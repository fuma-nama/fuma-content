```ts title="docs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { comarkStore } from "fuma-content/collections/comark/runtime";
import { default as __0 } from "./generate-comark/card.mdc?collection=docs";
import { default as __1 } from "./generate-comark/index.md?collection=docs";
export const docs = comarkStore<typeof Config,"docs",unknown>("docs","packages/fuma-content/test/fixtures/generate-comark",{"card.mdc": __0,"index.md": __1,});
```

```ts title="docs.browser.ts"
// @ts-nocheck
import { comarkStoreBrowser } from "fuma-content/collections/comark/runtime-browser";
import type * as Config from "./config";
export const docs = comarkStoreBrowser<typeof Config,"docs",unknown>("docs",{"card.mdc": () => import("./generate-comark/card.mdc?collection=docs").then(mod => mod.default),"index.md": () => import("./generate-comark/index.md?collection=docs").then(mod => mod.default),});
```

```ts title="lazyDocs.ts"
// @ts-nocheck
import type * as Config from "./config";
import { comarkStoreLazy } from "fuma-content/collections/comark/runtime";
import { frontmatter as __0 } from "./generate-comark/card.mdc?collection=lazyDocs&only=frontmatter";
import { frontmatter as __1 } from "./generate-comark/index.md?collection=lazyDocs&only=frontmatter";
export const lazyDocs = comarkStoreLazy<typeof Config,"lazyDocs",unknown>("lazyDocs","packages/fuma-content/test/fixtures/generate-comark",{ head: {"card.mdc": __0,"index.md": __1,}, body: {"card.mdc": () => import("./generate-comark/card.mdc?collection=lazyDocs").then(mod => mod.default),"index.md": () => import("./generate-comark/index.md?collection=lazyDocs").then(mod => mod.default),} });
```

```ts title="lazyDocs.browser.ts"
// @ts-nocheck
import { comarkStoreBrowser } from "fuma-content/collections/comark/runtime-browser";
import type * as Config from "./config";
export const lazyDocs = comarkStoreBrowser<typeof Config,"lazyDocs",unknown>("lazyDocs",{"card.mdc": () => import("./generate-comark/card.mdc?collection=lazyDocs").then(mod => mod.default),"index.md": () => import("./generate-comark/index.md?collection=lazyDocs").then(mod => mod.default),});
```