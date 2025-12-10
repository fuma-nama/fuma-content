import { loader, type MetaData, type Source } from "fumadocs-core/source";
import { docs } from "content/server";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

export const source = loader(mySource(), {
  baseUrl: "/docs",
  plugins: [lucideIconsPlugin()],
});

function mySource(): Source<{
  metaData: MetaData;
  pageData: (typeof docs)["$inferData"]["compiled"]["frontmatter"] & {
    id: string;
    compiled: (typeof docs)["$inferData"]["compiled"];
  };
}> {
  return {
    files: docs.list().map((doc) => ({
      type: "page",
      path: doc.path,
      absolutePath: doc.fullPath,
      data: {
        ...doc.compiled.frontmatter,
        id: doc.id,
        compiled: doc.compiled,
      },
    })),
  } satisfies Source;
}
