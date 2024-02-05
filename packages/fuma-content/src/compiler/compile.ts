import * as fs from "node:fs/promises";
import type { VFile } from "@mdx-js/mdx/internal-create-format-aware-processors";
import { loadMDX } from "../loader/mdx";
import type { Compiler } from "./types";

export interface OutputEntry {
  file: string;
  content: string;
  vfile: VFile;
}

export async function compile(this: Compiler): Promise<OutputEntry[]> {
  this._output = await Promise.all(
    this.files.map((file) => this.compileFile(file))
  );

  return this._output;
}

export async function compileFile(
  this: Compiler,
  file: string
): Promise<OutputEntry> {
  const cache = this._cache.get(file);
  if (cache) return cache;

  const content = (await fs.readFile(file)).toString();
  const output = await loadMDX(file, content, this.options.mdxOptions ?? {});

  const entry: OutputEntry = {
    file,
    vfile: output.file,
    content: output.content,
  };

  this._cache.set(file, entry);
  return entry;
}
