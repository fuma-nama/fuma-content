#!/usr/bin/env node

import { existsSync } from "node:fs";

async function start() {
  const [configPath, outDir] = process.argv.slice(2);
  const isNext =
    existsSync("next.config.js") ||
    existsSync("next.config.mjs") ||
    existsSync("next.config.mts") ||
    existsSync("next.config.ts");

  if (isNext) {
    const { createStandaloneCore } = await import("./next");
    const core = await createStandaloneCore({ configPath, outDir });
    await core.emit({ write: true });
  } else {
    const { createStandaloneCore } = await import("./vite");
    const core = await createStandaloneCore({ configPath, outDir });
    await core.emit({ write: true });
  }
}

void start();
