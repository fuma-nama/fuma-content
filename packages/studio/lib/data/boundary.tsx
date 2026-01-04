import { ReactNode } from "react";
import { getCollectionItems, getDocumentItems } from "./actions";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { queryClient } from "./query";
import { BoundaryClient } from "./boundary.client";

export async function StudioPrefetchBoundary({ children }: { children: ReactNode }) {
  await queryClient.prefetchQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionItems(),
  });
  await queryClient.prefetchQuery({
    queryKey: ["documents"],
    queryFn: () => getDocumentItems(),
  });

  return (
    <BoundaryClient>
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </BoundaryClient>
  );
}
