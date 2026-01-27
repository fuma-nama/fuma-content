import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { collection, documentCollection } from "@/lib/data/store";
import { useCreateDocumentDialog } from "@/components/collection/client";
import { FilePlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DocumentActionsContext,
  DocumentActionsDropdown,
} from "@/components/collection/document/actions";
import { Link } from "react-router";
import { Route } from "./+types/page";
import { NotFoundError } from "@/root";

export default function Page(args: Route.ComponentProps) {
  const collectionId = args.params.name;
  const { data: info } = useLiveQuery((q) =>
    q
      .from({ collection })
      .where((b) => eq(b.collection.id, collectionId))
      .findOne(),
  );
  const { data: documents } = useLiveQuery((q) =>
    q
      .from({ documentCollection })
      .where((b) => eq(b.documentCollection.collectionId, collectionId)),
  );
  const createDoc = useCreateDocumentDialog(collectionId);
  if (!info) throw new NotFoundError();

  info.name;
  return (
    <>
      <SiteHeader>
        <h1 className="font-mono text-sm">{info.name}</h1>
      </SiteHeader>
      <div className="flex flex-1 min-w-0 flex-col gap-2 px-2 py-6">
        <h1 className="mb-2 inline-flex items-center gap-2 font-mono font-semibold text-2xl">
          {info.name}
          <Badge className="text-sm empty:hidden">{info.badge}</Badge>
        </h1>
        {info.supportStudio ? (
          <div className="grid grid-cols-1 border rounded-lg bg-card text-card-foreground overflow-hidden">
            <div className="flex items-center gap-2 bg-secondary ps-4 pe-2 py-2">
              <p className="text-sm text-muted-foreground me-auto">{documents.length} Items</p>
              {createDoc && (
                <createDoc.component>
                  <createDoc.trigger className={buttonVariants()}>
                    <FilePlusIcon />
                    Create Document
                  </createDoc.trigger>
                </createDoc.component>
              )}
            </div>

            {documents.map((doc) => (
              <DocumentActionsContext key={doc.id} document={doc}>
                <div className="flex text-sm font-medium hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground">
                  <Link to={`/collection/${info.name}/${doc.id}`} className="px-4 py-2 flex-1">
                    {doc.name}
                  </Link>
                  <DocumentActionsDropdown document={doc} />
                </div>
              </DocumentActionsContext>
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
