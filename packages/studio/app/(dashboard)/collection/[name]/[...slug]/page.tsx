import { notFound } from "next/navigation";
import { requireDocument } from "@/lib/config";
import { Header } from "./page.client";

export default async function Page({ params }: PageProps<"/collection/[name]/[...slug]">) {
  const { name, slug } = await params;
  const { collection, document } = await requireDocument(name, slug[0]).catch(() => notFound());

  return (
    <>
      <Header collectionId={collection.name} documentId={document.id} />
      <div className="flex flex-1 min-w-0 flex-col gap-2 px-2 py-6">
        {await collection.handlers.studio.pages?.edit?.({ document, collection })}
      </div>
    </>
  );
}
