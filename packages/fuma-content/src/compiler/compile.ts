import * as fs from "node:fs/promises";
import loadMDX from "../loader/mdx";
import { Compiler } from "./types";
import type { VFile } from "@mdx-js/mdx/lib/compile";

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

  console.log("compile", file);
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
