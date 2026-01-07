#!/usr/bin/env -S node --no-warnings

import open from "open";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { program } from "commander";
import { name as appName, version as appVersion } from "../package.json";
import { x } from "tinyexec";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize CLI setup (arguments, options, parsing)
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
  const HOST = options.bind;
  const PORT = options.port;
  const URLorPORT = program.args[0];
  const URL = Number.isInteger(URLorPORT) ? `http://${HOST}:${URLorPORT}` : URLorPORT;

  console.log(`\n   ● Fuma Content ${appVersion}`);

  // Setting up for IO
  const io = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const env = {
    ...process.env,
    HOSTNAME: HOST,
    PORT: String(PORT),
    CSM_VERSION: appVersion,
    LOCAL: "true",
    USING_NPX: "true",
    DISABLE_ANALYTICS: "true",
  };

  const nextBinPath = path.join(__dirname, "../node_modules/next/dist/bin/next");
  console.log("building app...");
  await x("node", [nextBinPath, "build"], {
    nodeOptions: {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      cwd: path.join(__dirname, "../"),
    },
  });

  console.log("starting app...");
  // Setting up process
  const serverProcess = x("node", [nextBinPath, "start"], {
    persist: true,
    nodeOptions: {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      cwd: path.join(__dirname, "../"),
    },
  });

  const cleanup = () => {
    console.log(`\n → Stopping server on port ${PORT}...`);
    serverProcess.kill("SIGTERM");
    process.exit();
  };

  process.on("SIGINT", cleanup); // Ctrl + C
  process.on("SIGTERM", cleanup); // Kill command

  for await (const message of serverProcess) {
    if (message.startsWith("   ▲ Next.js ")) {
      process.stdout.write(message.replace("Next.js", "Using Next.js"));
      return;
    }
    if (message.startsWith("   - Local:")) {
      process.stdout.write(
        `   - Local: http://${HOST}:${PORT}
   - Starting... 🚀\n\n`,
      );
      return;
    }

    process.stdout.write(message);

    if (message.includes(`✓ Ready in`)) {
      io.question(" ? Do you want to open the browser? (Y/n) ", (answer) => {
        if (answer.toLowerCase() === "y" || answer === "") {
          console.log(` → Opening browser at http://${HOST}:${PORT}`);
          open(`http://${HOST}:${PORT}${URL ? `/?url=${URL}` : ""}`);
        } else {
          console.log(" → Skipping browser launch.");
        }
        io.close();
      });
    }
  }
}
