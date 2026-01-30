"use client";
import { DocumentActionsDropdown } from "@/components/collection/document/actions";
import { SiteHeader } from "@/components/site-header";
import { documentCollection } from "@/lib/data/store";
import { eq, and, useLiveQuery } from "@tanstack/react-db";
import { Link } from "react-router";

export function Header({ collectionId, documentId }: { collectionId: string; documentId: string }) {
  const query = useLiveQuery((q) =>
    q
      .from({ doc: documentCollection })
      .where((b) => and(eq(b.doc.id, documentId), eq(b.doc.collectionId, collectionId)))
      .findOne(),
  );
  const doc = query.data;
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
