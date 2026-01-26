import { Metadata } from "next";

export function createMetadata(metadata: Metadata): Metadata {
  return {
    title: {
      template: "Fuma Content - %s",
      default: "Fuma Content",
    },
    description: "The content processing primitive.",
    ...metadata,
    openGraph: {
      images: "/banner.png",
      type: "website",
      ...metadata.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      ...metadata.twitter,
    },
  };
}
