"use client";
import { DocumentActionsDropdown } from "@/components/collection/document/actions";
import { SiteHeader } from "@/components/site-header";
import { useDocuments } from "@/lib/yjs/store";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

export function Header({ collectionId, documentId }: { collectionId: string; documentId: string }) {
  const navigate = useNavigate();
  const docs = useDocuments();
  const doc = docs?.find((doc) => doc.collectionId === collectionId && doc.id === documentId);

  const isReady = docs !== null;
  useEffect(() => {
    if (!doc && isReady) navigate(`/collection/${collectionId}`);
  }, [doc, collectionId, isReady]);

  return (
    <SiteHeader>
      <Link to={`/collection/${collectionId}`} className="font-mono text-sm">
        {collectionId}/{doc?.name}
      </Link>
      {doc && <DocumentActionsDropdown document={doc} />}
    </SiteHeader>
  );
}
