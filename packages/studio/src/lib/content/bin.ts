#!/usr/bin/env -S node --no-warnings

import open from "open";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { name as appName, version as appVersion } from "../../../package.json";
import { x } from "tinyexec";
import { intro, outro, confirm, isCancel, log, spinner } from "@clack/prompts";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name(appName)
  .version(appVersion)
  .description("The Studio app of Fuma Content")
  .option("-p, --port <number>", "Specify port number", (value) => parseInt(value, 10), 3050)
  .option("-b, --bind <address>", "Specify address to bind", "localhost")
  .parse(process.argv);
const options = program.opts();
void main();

async function main() {
  const isCI = process.env.CI === "1";
  const { bind: HOST, port: PORT } = options;
  const serveBinPath = path.join(__dirname, "../node_modules/@react-router/serve/bin.js");
  // where the `pacage.json` locates
  const rootDir = path.join(__dirname, "../");
  const studioConfig = path.resolve("content.config.ts");

  intro(`Fuma Content ${appVersion}`);
  log.info(`Config Path: ${studioConfig}`);

  const env = {
    ...process.env,
    HOSTNAME: HOST,
    PORT: String(PORT),
    STUDIO_PARENT_DIR: process.cwd(),
    STUDIO_VERSION: appVersion,
    STUDIO_CONFIG: studioConfig,
    CI: "1",
    DISABLE_ANALYTICS: "true",
  };

  const serverProcess = x("node", [serveBinPath, "build/server/index.js"], {
    nodeOptions: {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      cwd: rootDir,
    },
  });

  process.on("exit", () => {
    outro(`Stopping server on port ${PORT}...`);
    serverProcess.kill("SIGTERM");
  });

  for await (const message of serverProcess) {
    log.message(message, { spacing: 0 });

    if (message.includes(`[react-router-serve]`) && !isCI) {
      const shouldOpen = await confirm({
        message: "Do you want to open on browser?",
      });

      if (isCancel(shouldOpen)) {
        process.exit();
      }

      if (shouldOpen) {
        log.message(`Opening browser at http://${HOST}:${PORT}`, { spacing: 0 });
        void open(`http://${HOST}:${PORT}`);
      }
    }
  }
}
