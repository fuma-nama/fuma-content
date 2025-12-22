import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";

export interface PreprocessOptions {
  preprocessor?: Processor<Root>;
}

declare module "vfile" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extend data map
  interface DataMap {
    _preprocessed?: boolean;
  }
}

export function remarkPreprocess(options?: PreprocessOptions): Transformer<Root, Root> {
  return async (tree, file) => {
    if (file.data._preprocessed) return;
    file.data._preprocessed = true;

    if (options?.preprocessor) {
      return (await options.preprocessor.run(tree)) as Root;
    }
  };
}
