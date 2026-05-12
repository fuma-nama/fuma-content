import { requireDocument } from "@/lib/config";
import { studioHook } from "@/lib/content/index";
import { Fragment } from "react";
import type { PageProps } from "waku/router";
import { CollectionViewHeader } from "@/components/collection/document/view";
import { unstable_notFound } from "waku/router/server";

export default async function Page({ id, name }: PageProps<"/collection/[name]/[id]">) {
  const { collection, document } = await requireDocument(name, id).catch(() => {
    unstable_notFound();
  });

  return (
    <>
      <CollectionViewHeader collectionId={name} documentId={id} />
      <Fragment key={id}>
        {await collection.pluginHook(studioHook).pages?.edit?.({ document, collection })}
      </Fragment>
    </>
  );
}

export function getConfig() {
  return {
    render: "dynamic",
  };
}
