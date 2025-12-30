import { notFound } from "next/navigation";
import { getCore } from "@/lib/config";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { CollectionDocumentActions } from "@/components/collection/document/actions";

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
      <SiteHeader>
        <Link href={`/collection/${collection.name}`} className="font-mono text-sm">
          {collection.name}/{document.name}
        </Link>
        <CollectionDocumentActions
          collectionId={collection.name}
          documentId={document.id}
          allowDelete={handler.actions?.deleteDocument !== undefined}
        />
      </SiteHeader>
      <div className="flex flex-1 min-w-0 flex-col gap-2 px-2 py-6">
        {await handler.pages?.edit?.({ document, collection })}
      </div>
    </>
  );
}
