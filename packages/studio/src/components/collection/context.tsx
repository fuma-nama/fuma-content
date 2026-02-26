"use client";
import type { ClientContext } from "@/lib/content";
import { createContext, ReactNode, use, useMemo } from "react";

const ClientContext = createContext<Map<string, ClientContext> | null>(null);

export function ClientContextProvider({
  contexts,
  children,
}: {
  contexts: Map<string, ClientContext>;
  children: ReactNode;
}) {
  const cachedCtx = useMemo(() => contexts, []);

  return <ClientContext value={cachedCtx}>{children}</ClientContext>;
}

/**
 * you can assume the client context is immutable
 */
export function useClientContext(collectionId: string | undefined): ClientContext {
  if (!collectionId) return {};
  return use(ClientContext)?.get(collectionId) ?? {};
}
