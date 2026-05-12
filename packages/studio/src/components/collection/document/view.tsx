"use client";
import { DocumentActionsDropdown } from "@/components/collection/document/actions";
import { SiteHeader } from "@/components/site-header";
import { useDocuments } from "@/lib/yjs/store";
import { useEffect } from "react";
import { Link, useRouter } from "waku";

export function CollectionViewHeader({
  collectionId,
  documentId,
}: {
  collectionId: string;
  documentId: string;
}) {
  const router = useRouter();
  const docs = useDocuments();
  const doc = docs?.find((doc) => doc.collectionId === collectionId && doc.id === documentId);

  const isReady = docs !== null;
  useEffect(() => {
    if (!doc && isReady) router.push(`/collection/${collectionId}`);
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
