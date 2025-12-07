import type { CodeGenerator } from "@/utils/code-generator";
import type { EntryFileContext } from "@/plugins/entry-file";

export class ListGenerator {
  private readonly codegen: CodeGenerator;
  private current: string[] = [];

  constructor({ codegen }: EntryFileContext) {
    this.codegen = codegen;
    codegen.addNamedImport(["list"], "fuma-content/runtime/list");
  }

  create(name: string, input: string) {
    this.current = [`export const ${name} = list(${input})`];
  }

  composer(fn: string) {
    this.current.push(`.composer(${fn})`);
  }

  flush() {
    this.codegen.push(`${this.current.join("\n")};`);
  }
}
