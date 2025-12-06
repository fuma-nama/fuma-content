"use client";
import { type ReactNode, useState } from "react";

export function Hide({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <button onClick={() => setOpen((v) => !v)}>
      <div
        className={open ? "text-inherit" : "text-transparent bg-neutral-800"}
      >
        {children}
      </div>
    </button>
  );
}
