import { createCompiler } from "../src/compiler";
import { test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { getOutputPath } from "../src/utils/path";
import { OutputEntry } from "../src/compiler/compile";
import type { Compiler } from "../src/compiler/types";

const cwd = fileURLToPath(new URL("./", import.meta.url));

function check(compiler: Compiler, entries: OutputEntry[]) {
  for (const entry of entries) {
    expect(entry.content).toMatchFileSnapshot(getOutputPath(compiler, entry));

    if (entry.dependencies) check(compiler, entry.dependencies);
  }
}

test("Run", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/index.mdx"],
    outputDir: "./out/run",
    cwd,
  });

  check(compiler, await compiler.compile());
});

test("Export frontmatter", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/frontmatter.mdx"],
    outputDir: "./out/frontmatter",
    cwd,
  });

  check(compiler, await compiler.compile());
});

test("Import paths", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/import.mdx"],
    outputDir: "./out/import",
    cwd,
  });

  check(compiler, await compiler.compile());
});
