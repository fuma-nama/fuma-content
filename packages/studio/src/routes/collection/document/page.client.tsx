"use client";
import { DocumentActionsDropdown } from "@/components/collection/document/actions";
import { SiteHeader } from "@/components/site-header";
import { useDocuments } from "@/lib/yjs/store";
import { Link } from "react-router";

export function Header({ collectionId, documentId }: { collectionId: string; documentId: string }) {
  const doc = useDocuments().find(
    (doc) => doc.collectionId === collectionId && doc.id === documentId,
  );
  if (!doc) return;

  return (
    <SiteHeader>
      <Link to={`/collection/${collectionId}`} className="font-mono text-sm">
        {collectionId}/{doc.name}
      </Link>
      <DocumentActionsDropdown document={doc} />
    </SiteHeader>
  );
}
