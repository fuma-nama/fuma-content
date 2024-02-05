import type { EmitEntry } from "./emit";
import type { Compiler } from "./types";

export interface Manifest {
  entires: EmitEntry[];
}

export function createManifest(this: Compiler): Manifest {
  const emit = this._emit;
  if (!emit) throw new Error("You have to run emit() first");

  return { entires: emit };
}
