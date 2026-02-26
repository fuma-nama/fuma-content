import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { useCreateDocumentDialog } from "@/components/collection/client";
import { PlusIcon, ViewIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DocumentActionsContext,
  DocumentActionsDropdown,
} from "@/components/collection/document/actions";
import { Link } from "react-router";
import { Route } from "./+types/page";
import { NotFoundError } from "@/root";
import { cn } from "@/lib/utils";
import { useCollections, useDocuments } from "@/lib/yjs/store";

export default function Page(args: Route.ComponentProps) {
  const collectionId = args.params.name;
  const info = useCollections().find((item) => item.id === collectionId);
  const documents = useDocuments().filter((doc) => doc.collectionId === collectionId);
  const createDoc = useCreateDocumentDialog(info);

  if (!info) throw new NotFoundError();
  return (
    <>
      <SiteHeader>
        <h1 className="font-mono text-sm truncate">{info.name}</h1>
        <Badge variant="outline" className="text-xs font-mono empty:hidden">
          {info.badge}
        </Badge>
      </SiteHeader>
      {info.supportStudio ? (
        <>
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-3 px-4 border-b">
            <ViewIcon className="size-4" />
            All Documents
            {createDoc && (
              <createDoc.component>
                <createDoc.trigger className={cn(buttonVariants({ size: "xs" }), "ms-auto")}>
                  <PlusIcon />
                  <span className="max-md:hidden">Create Document</span>
                  <span className="md:hidden">Create</span>
                </createDoc.trigger>
              </createDoc.component>
            )}
          </div>
          <div className="flex flex-col p-2 flex-1 overflow-auto">
            {documents.map((doc) => (
              <DocumentActionsContext key={doc.id} document={doc}>
                <div className="flex items-center rounded-md text-muted-foreground border-b last:border-b-0 hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground">
                  <Link
                    to={`/collection/${info.name}/${doc.id}`}
                    className="inline-flex items-center text-sm font-mono ps-2 py-2 flex-1"
                  >
                    {doc.name}
                  </Link>
                  <DocumentActionsDropdown document={doc} />
                </div>
              </DocumentActionsContext>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t px-4 h-10">
            <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
              Documents: {documents.length}
            </Badge>
          </div>
        </>
      ) : (
        <div className="bg-muted flex-1 text-sm text-muted-foreground p-4 text-center">
          This collection doesn't have studio integration.
        </div>
      )}
    </>
  );
}
