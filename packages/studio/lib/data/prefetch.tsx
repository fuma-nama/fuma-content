import { ReactNode } from "react";
import { queryClient } from "./query";
import { getCollectionItems, getDocumentItems } from "../actions";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export async function StudioPrefetchBoundary({ children }: { children: ReactNode }) {
  await queryClient.prefetchQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionItems(),
  });
  await queryClient.prefetchQuery({
    queryKey: ["documents"],
    queryFn: () => getDocumentItems(),
  });

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
