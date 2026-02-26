"use client";
import { DocumentActionsDropdown } from "@/components/collection/document/actions";
import { SiteHeader } from "@/components/site-header";
import { useDocuments } from "@/lib/yjs/store";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

export function Header({ collectionId, documentId }: { collectionId: string; documentId: string }) {
  const navigate = useNavigate();
  const doc = useDocuments().find(
    (doc) => doc.collectionId === collectionId && doc.id === documentId,
  );

  useEffect(() => {
    if (!doc) navigate(`/collection/${collectionId}`);
  }, [doc, collectionId]);

  if (!doc) return <SiteHeader>Deleted</SiteHeader>;

  return (
    <SiteHeader>
      <Link to={`/collection/${collectionId}`} className="font-mono text-sm">
        {collectionId}/{doc.name}
      </Link>
      <DocumentActionsDropdown document={doc} />
    </SiteHeader>
  );
}
