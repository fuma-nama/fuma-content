import type { Metadata } from "next/types";

export const baseUrl = "https://fuma-content.vercel.app";

export function createMetadata(overrides: Metadata): Metadata {
  return {
    ...overrides,
    openGraph: {
      type: "website",
      images: { width: 1200, height: 630, url: "/banner.png" },
      siteName: "Fuma Content",
      url: baseUrl,
      ...overrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      images: { width: 1200, height: 630, url: "/banner.png" },
      ...overrides.twitter,
    },
    metadataBase: new URL(baseUrl),
  };
}
