import type { EmitEntry } from "./emit";
import type { Compiler } from "./types";

export interface Manifest {
  entires: EmitEntry[];
}

export async function createManifest(this: Compiler): Promise<Manifest> {
  const emit = this._emit;
  if (!emit) throw new Error("You have to run emit() first");

  return { entires: emit };
}
