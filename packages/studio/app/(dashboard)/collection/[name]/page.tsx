import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCore } from "@/lib/config";
import Link from "next/link";

export default async function Page({ params }: PageProps<"/collection/[name]">) {
  const core = await getCore();
  const collection = core.getCollection((await params).name);
  if (!collection) notFound();

  const handler = collection.handlers.studio;
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-2 p-6">
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
      {handler &&
        (await handler.getDocuments()).map((doc) => (
          <Link
            key={doc.id}
            href={`/collection/${collection.name}/${doc.id}`}
            className="font-medium p-4 bg-card text-card-foreground border rounded-lg"
          >
            {doc.name}
          </Link>
        ))}
    </div>
  );
}
