import { type InferPageType, loader, type Source, VirtualFile } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docs } from "content/docs";
import { meta } from "content/meta";
import type { TOCItemType } from "fumadocs-core/toc";
import type { StructuredData } from "fumadocs-core/mdx-plugins";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(mySource(), {
  baseUrl: "/docs",
  plugins: [lucideIconsPlugin()],
});

type PageData = (typeof docs)["$inferData"]["compiled"]["frontmatter"] & {
  toc?: TOCItemType[];
  structuredData?: StructuredData;
  compiled: (typeof docs)["$inferData"]["compiled"];
};

type MetaData = (typeof meta)["$inferData"]["data"];
function mySource(): Source<{
  metaData: MetaData;
  pageData: PageData;
}> {
  const files: VirtualFile<{ metaData: MetaData; pageData: PageData }>[] = [];
  for (const doc of docs.list()) {
    files.push({
      type: "page",
      path: doc.path,
      absolutePath: doc.fullPath,
      data: {
        ...doc.compiled.frontmatter,
        structuredData: doc.compiled.structuredData as StructuredData,
        toc: doc.compiled.toc as TOCItemType[],
        compiled: doc.compiled,
      },
    });
  }

  for (const item of meta.list()) {
    files.push({
      type: "meta",
      path: item.path,
      absolutePath: item.fullPath,
      data: item.data,
    });
  }

  return {
    files,
  };
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = page.data.compiled._markdown;

  return `# ${page.data.title}

${processed}`;
}
