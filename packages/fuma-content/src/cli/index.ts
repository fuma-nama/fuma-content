#!/usr/bin/env node

import { Cli, Command, Option } from "clipanion";
import { createCompiler } from "../compiler";
import { loadConfig } from "../utils/load-config";

class BuildCommand extends Command {
  static paths = [[`build`]];

  config = Option.String({ required: false });

  async execute(): Promise<void> {
    const config = await loadConfig(this.config);
    const compiler = await createCompiler(config);
    await compiler.emit();

    this.context.stdout.write(`Build successful\n`);
  }
}

class WatchCommand extends Command {
  static paths = [[`watch`]];

  config = Option.String({ required: false });

  async execute(): Promise<void> {
    const config = await loadConfig(this.config);
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
