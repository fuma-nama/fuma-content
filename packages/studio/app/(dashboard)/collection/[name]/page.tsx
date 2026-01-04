import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCore } from "@/lib/config";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createDocumentContext, CreateDocumentDialog } from "./client";

export default async function Page({ params }: PageProps<"/collection/[name]">) {
  const core = await getCore();
  const collection = core.getCollection((await params).name);
  if (!collection) notFound();

  const handler = collection.handlers.studio;
  const documents = await handler?.getDocuments();
  return (
    <>
      <SiteHeader>
        <h1 className="font-mono text-sm">{collection.name}</h1>
      </SiteHeader>
      <div className="flex flex-1 min-w-0 flex-col gap-2 px-2 py-6">
        <h1 className="mb-2 inline-flex items-center gap-2 font-mono font-semibold text-2xl">
          {collection.name}
          <Badge className="text-sm">{collection.typeInfo.id}</Badge>
        </h1>
        <div className="mb-4 flex flex-row flex-wrap items-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">Implements</p>
          {Object.keys(collection.handlers).map((handler) => (
            <Badge key={handler} variant="outline">
              {handler}
            </Badge>
          ))}
        </div>
        {handler && documents ? (
          <div className="grid grid-cols-1 border rounded-lg bg-card text-card-foreground overflow-hidden">
            <div className="flex items-center gap-2 bg-secondary ps-4 pe-2 py-2">
              <p className="text-sm text-muted-foreground me-auto">{documents.length} Items</p>
              {handler.dialogs?.create && (
                <CreateDocumentDialog>
                  {await handler.dialogs.create({
                    collection,
                    clientContext: createDocumentContext,
                  })}
                </CreateDocumentDialog>
              )}
            </div>

            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/collection/${collection.name}/${doc.id}`}
                className="text-sm font-medium px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                {doc.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-muted text-sm text-muted-foreground p-4 rounded-lg border text-center">
            This collection doesn't have studio integration.
          </div>
        )}
      </div>
    </>
  );
}
