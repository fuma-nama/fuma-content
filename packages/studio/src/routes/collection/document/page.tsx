import { requireDocument } from "@/lib/config";
import { Header } from "./page.client";
import { studioHook } from "@/lib/content/index";
import { Route } from "./+types/page";
import { NotFoundError } from "@/root";
import { Fragment } from "react";

export async function ServerComponent({ params }: Route.ComponentProps) {
  const { name, id } = params;
  const { collection, document } = await requireDocument(name, id).catch(() => {
    throw new NotFoundError();
  });

  return (
    <>
      <Header collectionId={name} documentId={id} />
      <Fragment key={id}>
        {await collection.pluginHook(studioHook).pages?.edit?.({ document, collection })}
      </Fragment>
    </>
  );
}
