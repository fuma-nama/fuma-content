import type { CreateCompilerOptions } from "./compiler";

export const defaultConfig: CreateCompilerOptions = {
  files: ["./content/**/*.md", "./content/**/*.mdx"],
};

export const defaultConfigPath = "./fc.config.js";
