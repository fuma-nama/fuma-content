import { notFound } from "next/navigation";
import { getCore } from "@/lib/config";
import Client from "./page.client";

export default async function Page({ params }: PageProps<"/collection/[name]">) {
  const core = await getCore();
  const collection = core.getCollection((await params).name);
  if (!collection) notFound();

  return <Client collectionId={collection.name} />;
}
