import { notFound } from "next/navigation";
import { getCore } from "@/lib/config";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

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
      </SiteHeader>
      <div className="flex flex-1 min-w-0 flex-col gap-2 p-6">
        <h1 className="inline-flex items-center gap-2 mb-4 font-medium text-2xl">
          <span className="text-muted-foreground">Editing</span>
          <code>{document.name}</code>
        </h1>
        {await handler.pages?.edit?.({ document, collection })}
      </div>
    </>
  );
}
