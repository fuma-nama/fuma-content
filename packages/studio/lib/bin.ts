#!/usr/bin/env -S node --no-warnings

import open from "open";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { name as appName, version as appVersion } from "../package.json";
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
  const HOST = options.bind;
  const PORT = options.port;
  const nextBinPath = path.join(__dirname, "../node_modules/next/dist/bin/next");

  intro(`Fuma Content ${appVersion}`);
  const env = {
    ...process.env,
    HOSTNAME: HOST,
    PORT: String(PORT),
    STUDIO_VERSION: appVersion,
    CI: "1",
    DISABLE_ANALYTICS: "true",
  };

  {
    const spin = spinner();
    spin.start("Building App (powered by Next.js)");
    const buildResult = x("node", [nextBinPath, "build"], {
      nodeOptions: {
        stdio: ["ignore", "pipe", "pipe"],
        env,
        cwd: path.join(__dirname, "../"),
      },
      throwOnError: true,
    });

    for await (const line of buildResult) {
      spin.message(`Building App: ${line.trim()}`);
    }

    spin.stop("Compiled to .studio directory");
  }

  const serverProcess = x("node", [nextBinPath, "start"], {
    nodeOptions: {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      cwd: path.join(__dirname, "../"),
    },
  });

  process.on("exit", () => {
    outro(`Stopping server on port ${PORT}...`);
    serverProcess.kill("SIGTERM");
  });

  for await (const message of serverProcess) {
    log.message(message, { spacing: 0 });

    if (message.includes(`✓ Ready in`) && !isCI) {
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
