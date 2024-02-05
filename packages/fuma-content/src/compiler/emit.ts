import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { Compiler } from "./types";
import type { OutputEntry } from "./compile";
import { createEntryPoint } from "./entry-point";

export interface EmitEntry extends OutputEntry {
  outputPath: string;
}

export async function emit(this: Compiler): Promise<void> {
  const entires = await this.compile();
  const emits = entires.map(async (entry) => this.emitEntry(entry));

  this._emit = await Promise.all(emits);
  await writeEntryPoint.bind(this)();
}

async function writeEntryPoint(this: Compiler): Promise<void> {
  const outputPath = path.join(
    this.options.cwd,
    this.options.outputDir,
    "./index.entry.js"
  );

  const code = createEntryPoint.bind(this)();

  await fs.writeFile(outputPath, code);
}

export async function emitEntry(
  this: Compiler,
  entry: OutputEntry
): Promise<EmitEntry> {
  const { cwd, outputExt, outputDir } = this.options;

  const { file, content } = entry;
  const outputPath = path.join(
    cwd,
    outputDir,
    path.relative(cwd, path.dirname(file)),
    `${path.basename(file, path.extname(file))}${outputExt}`
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);

  return {
    ...entry,
    outputPath,
  };
}
