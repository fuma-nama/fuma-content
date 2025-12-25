import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCore } from "@/lib/config";

export default async function Page({ params }: PageProps<"/collection/[name]/[...slug]">) {
  const { name, slug } = await params;
  const core = await getCore();
  const collection = core.getCollection(name);
  if (!collection) notFound();
  const handler = collection.handlers.studio;
  if (!handler) notFound();
  const document = await handler.getDocument(slug.join("/"));
  if (!document) notFound();

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-2 p-6">
      <h1 className="inline-flex items-center gap-2 mb-4 font-medium text-2xl">
        <span className="text-muted-foreground">Editing</span>
        <code>{document.name}</code>
        <Badge className="text-sm">{collection.typeInfo.id}</Badge>
      </h1>
      {await handler.pages?.edit?.({ document })}
    </div>
  );
}
