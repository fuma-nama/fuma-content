import { CollectionActionsContext } from "@/components/collection/actions";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { useCollections } from "@/lib/yjs/store";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export default function Page() {
  const collections = useCollections();
  return (
    <>
      <SiteHeader>
        <h1 className="text-sm font-medium">Collections</h1>
      </SiteHeader>
      <div className="flex flex-col flex-1 p-2">
        {collections.map((collection) => (
          <CollectionActionsContext key={collection.id} collection={collection}>
            <Link
              to={`/collection/${collection.id}`}
              className="flex items-center gap-2 text-sm font-mono text-muted-foreground px-2 py-1.5 rounded-md border-b last:border-0 hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground"
            >
              <ChevronRight className="text-muted-foreground size-4" />
              {collection.name}
            </Link>
          </CollectionActionsContext>
        ))}
      </div>
      <div className="flex items-center h-10 px-4 border-t">
        <Badge variant="outline" className="font-mono text-muted-foreground">
          Collections: {collections.length}
        </Badge>
      </div>
    </>
  );
}
