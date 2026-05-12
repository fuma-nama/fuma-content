import { CollectionView } from "@/components/collection/view";
import type { PageProps } from "waku/router";

export default function Page(props: PageProps<"/collection/[name]">) {
  return <CollectionView collectionId={props.name} />;
}

export function getConfig() {
  return {
    render: "dynamic",
  };
}
