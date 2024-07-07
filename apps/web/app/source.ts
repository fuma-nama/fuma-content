import entry from "content";
import { document, json } from "fuma-content";
import { loader, type Source, type MetaData } from "fumadocs-core/source";
import { z } from "zod";

export const documents = document(entry, {
  include: ["content/*"],
  schema: z.object({ title: z.string(), description: z.string().optional() }),
});

export const jsons = json(entry, {
  schema: z.object({ title: z.string() }),
});

function createSource(): Source<{
  metaData: MetaData;
  pageData: (typeof documents)[number]["info"] & {
    renderer: (typeof documents)[number]["renderer"];
    [key: string]: unknown;
  };
}> {
  return {
    files: documents.map(({ info, file, renderer, ...rest }) => ({
      path: file,
      data: { ...info, renderer, ...rest },
      type: "page",
    })),
  };
}

export const { getPage, getPages, pageTree } = loader({
  rootDir: "content",
  baseUrl: "/docs",
  source: createSource(),
});
