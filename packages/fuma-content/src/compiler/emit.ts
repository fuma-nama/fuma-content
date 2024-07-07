import * as path from "node:path";
import * as fs from "node:fs/promises";
import { getOutputPath } from "../utils/path";
import type { Compiler } from "./types";
import type { OutputEntry } from "./compile";

export interface EmitEntry extends OutputEntry {
  outputPath: string;
}

interface CompilerWithCache extends Compiler {
  _emitCache?: WeakMap<OutputEntry, EmitEntry>;
}

export async function emit(this: Compiler): Promise<void> {
  const entires = await this.compile();
  const emits = entires.map(async (entry) => this.emitEntry(entry));

  this._emit = await Promise.all(emits);
}

export async function emitEntry(
  this: CompilerWithCache,
  entry: OutputEntry,
): Promise<EmitEntry> {
  this._emitCache ||= new WeakMap();

  const cached = this._emitCache.get(entry);
  if (cached) return cached;

  const outputPath = getOutputPath(this, entry);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, entry.content);

  if (entry.dependencies) {
    await Promise.all(entry.dependencies.map((dep) => this.emitEntry(dep)));
  }

  const output: EmitEntry = {
    ...entry,
    outputPath,
  };

  this._emitCache.set(entry, output);
  return output;
}

export function removeCache(
  compiler: CompilerWithCache,
  entry: OutputEntry,
): void {
  compiler._emitCache?.delete(entry);
}
