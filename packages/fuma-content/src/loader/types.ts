import type { VFile } from "@mdx-js/mdx/internal-create-format-aware-processors";
import type { Compiler } from "../compiler/types";
import type { OutputEntry } from "../compiler/compile";

export interface Output {
  dependencies?: OutputEntry[];
  content: string;

  _entryPoint?: unknown;
  _mdx?: {
    vfile: VFile;
  };
}

export type Transformer = (
  this: Compiler,
  file: string,
  source: string,
) => Output | Promise<Output>;
