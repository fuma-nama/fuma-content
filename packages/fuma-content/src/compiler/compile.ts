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

interface CompilerWithCache extends Compiler {
  _compileCache?: Map<string, OutputEntry>;
}

export async function compile(this: Compiler): Promise<OutputEntry[]> {
  const output: OutputEntry[] = [];

  await Promise.all(
    this.files.map(async (file) => {
      const entry = await this.compileFile(file);

      output.push(entry);
    }),
  );

  output.push(loadEntryPoint.call(this, output));

  this._output = output;
  return output;
}

export async function compileFile(
  this: CompilerWithCache,
  file: string,
): Promise<OutputEntry> {
  this._compileCache ||= new Map();
  const cache = this._compileCache.get(file);
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

  this._compileCache.set(file, entry);
  return entry;
}

export function removeCache(compiler: CompilerWithCache, file: string): void {
  compiler._compileCache?.delete(file);
}
