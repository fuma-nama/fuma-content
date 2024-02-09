import { createCompiler } from "../src/compiler";
import { test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { getOutputPath } from "../src/utils/path";

const cwd = fileURLToPath(new URL("./", import.meta.url));

test("Run", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/index.mdx"],
    outputDir: "./out/run",
    cwd,
  });

  const entires = await compiler.compile();

  for (const entry of entires) {
    expect(entry.content).toMatchFileSnapshot(getOutputPath(compiler, entry));
  }
});

test("Export frontmatter", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/frontmatter.mdx"],
    outputDir: "./out/frontmatter",
    cwd,
  });

  const entires = await compiler.compile();

  for (const entry of entires) {
    expect(entry.content).toMatchFileSnapshot(getOutputPath(compiler, entry));
  }
});

test("Import paths", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/import.mdx"],
    outputDir: "./out/import",
    cwd,
  });

  const entires = await compiler.compile();

  for (const entry of entires) {
    expect(entry.content).toMatchFileSnapshot(getOutputPath(compiler, entry));
  }
});
