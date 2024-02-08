import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadEntryPoint } from "../loader/entry-point";
import type { Output } from "../loader/types";
import type { Compiler } from "./types";

export interface OutputEntry extends Output {
  /**
   * extension of file, like: `md`
   */
  format: string;

  file: string;
}

export async function compile(this: Compiler): Promise<OutputEntry[]> {
  this._output = await Promise.all(
    this.files.map((file) => this.compileFile(file))
  );

  this._output.push(loadEntryPoint.call(this, this._output));

  return this._output;
}

export async function compileFile(
  this: Compiler,
  file: string
): Promise<OutputEntry> {
  const cache = this._cache.get(file);
  if (cache) return cache;

  const format = path.extname(file).slice(1);
  const content = (await fs.readFile(file)).toString();
  const loader = this.loaders[format];

  const output = await loader?.call(this, file, content);

  if (!output) {
    throw new Error(`Unknown format: ${format}`);
  }

  const entry: OutputEntry = {
    file,
    format,
    ...output,
  };

  this._cache.set(file, entry);
  return entry;
}
