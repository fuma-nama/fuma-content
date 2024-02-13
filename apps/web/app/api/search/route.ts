import { getPages } from "@/app/source";
import type { StructuredData } from "fumadocs-core/mdx-plugins";
import { createSearchAPI } from "fumadocs-core/search/server";

export const { GET } = createSearchAPI("advanced", {
  indexes: getPages().map((page) => ({
    title: page.data.title,
    structuredData: page.data.structuredData as StructuredData,
    id: page.url,
    url: page.url,
  })),
});
