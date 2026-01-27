import { requireDocument } from "@/lib/config";
import { Header } from "./page.client";
import { studioHook } from "@/lib/content/index";
import { Route } from "./+types/page";
import { NotFoundError } from "@/root";

export async function ServerComponent({ params }: Route.ComponentProps) {
  const { name, id } = params;
  const { collection, document } = await requireDocument(name, id).catch(() => {
    throw new NotFoundError();
  });

  return (
    <>
      <Header collectionId={collection.name} documentId={document.id} />
      <div className="flex flex-1 min-w-0 flex-col gap-2 p-2">
        {await collection.pluginHook(studioHook).pages?.edit?.({ document, collection })}
      </div>
    </>
  );
}
