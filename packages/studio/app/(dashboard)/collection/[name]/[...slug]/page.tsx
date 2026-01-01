import { notFound } from "next/navigation";
import { getCore } from "@/lib/config";
import { Header } from "./page.client";

export default async function Page({ params }: PageProps<"/collection/[name]/[...slug]">) {
  const { name, slug } = await params;
  const core = await getCore();
  const collection = core.getCollection(name);
  if (!collection) notFound();
  const handler = collection.handlers.studio;
  if (!handler) notFound();
  const document = await handler.getDocument(slug.join("/"));
  if (!document) notFound();

  return (
    <>
      <Header collectionId={collection.name} documentId={document.id} />
      <div className="flex flex-1 min-w-0 flex-col gap-2 px-2 py-6">
        {await handler.pages?.edit?.({ document, collection })}
      </div>
    </>
  );
}
