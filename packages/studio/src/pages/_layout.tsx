import { getCore } from "@/lib/config";
import { type ClientContext, studioHook } from "@/lib/content";
import type { ReactNode } from "react";
import { DashboardProviders } from "@/components/dashboard-providers";

export default async function Layout({ children }: { children: ReactNode }) {
  const core = await getCore();
  const collections = core.getCollections(true);
  const clientContexts = new Map<string, ClientContext>();
  for (const collection of collections) {
    const { client } = collection.pluginHook(studioHook);
    if (client) {
      clientContexts.set(collection.name, await client());
    }
  }

  return <DashboardProviders clientContexts={clientContexts}>{children}</DashboardProviders>;
}
