"use client";
import { CollectionActionsContext } from "@/components/collection/actions";
import { SiteHeader } from "@/components/site-header";
import { collection } from "@/lib/data/store";
import { useLiveQuery } from "@tanstack/react-db";
import { AppWindowIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const query = useLiveQuery((q) => q.from({ collection }));
  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-2 py-6">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold mb-6">
          <AppWindowIcon />
          Collections
        </h1>
        <div className="grid grid-cols-1 border rounded-lg bg-card text-card-foreground overflow-hidden">
          <div className="flex items-center gap-2 bg-secondary ps-4 pe-2 py-2">
            <p className="text-sm text-muted-foreground">Collections</p>
          </div>

          {query.data.map((collection) => (
            <CollectionActionsContext key={collection.id} collection={collection}>
              <Link
                href={`/collection/${collection.id}`}
                className="text-sm font-medium px-4 py-2 hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground"
              >
                {collection.name}
              </Link>
            </CollectionActionsContext>
          ))}
        </div>
      </div>
    </>
  );
}
