import * as path from "node:path";
import { createCompiler } from "../src";
import { test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { remarkMdxExport } from "../src/remark-plugins/remark-exports";

const cwd = fileURLToPath(new URL("./", import.meta.url));

test("Run", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/index.mdx"],
    cwd,
  });

  const entires = await compiler.compile();

  for (const entry of entires)
    expect(entry.content).toMatchFileSnapshot(
      `./out/${path.basename(entry.file)}.js`
    );
});

test("Export frontmatter", async () => {
  const compiler = await createCompiler({
    files: ["./fixtures/frontmatter.mdx"],
    cwd,
  });

  const entires = await compiler.compile();

  for (const entry of entires)
    expect(entry.content).toMatchFileSnapshot(
      `./out/${path.basename(entry.file)}.js`
    );
});
