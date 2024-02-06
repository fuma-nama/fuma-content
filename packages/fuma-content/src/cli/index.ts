#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";
import { Cli, Command, Option, UsageError } from "clipanion";
import type { CreateCompilerOptions } from "..";
import { createCompiler } from "..";

type Config = CreateCompilerOptions;

class BuildCommand extends Command {
  static paths = [[`build`]];

  config = Option.String({ required: false });

  async execute(): Promise<void> {
    const config = await getConfig(this.config);

    const compiler = await createCompiler(config);
    await compiler.emit();

    this.context.stdout.write(`Build successful\n`);
  }
}

async function getConfig(configFile = "./fc.config.js"): Promise<Config> {
  const configPath = path.resolve(configFile);

  if (!fs.existsSync(configPath))
    throw new UsageError("Configuration file not found");
  const importPath = pathToFileURL(configPath).toString();
  const { default: config } = (await import(importPath)) as {
    default: Config;
  };

  return config;
}

class WatchCommand extends Command {
  static paths = [[`watch`]];

  config = Option.String({ required: false });

  async execute(): Promise<void> {
    const config = await getConfig(this.config);

    const compiler = await createCompiler(config);

    this.context.stdout.write(`Started server\n`);
    compiler.watch();
  }
}

const [node, app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: `fuma-content-cli`,
  binaryName: `${node} ${app}`,
  binaryVersion: `1.0.0`,
});

cli.register(BuildCommand);
cli.register(WatchCommand);
void cli.runExit(args);
