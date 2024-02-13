import entry from "content";
import { document, json } from "fuma-content";
import { loader, Source } from "fumadocs-core/source";
import { z } from "zod";

export const documents = document(entry, {
  include: ["content/*"],
  schema: z.object({ title: z.string(), description: z.string().optional() }),
});

export const jsons = json(entry, {
  schema: z.object({ title: z.string() }),
});

export const { getPage, getPages, pageTree } = loader({
  rootDir: "content",
  baseUrl: "/docs",
  source: {
    files: documents.map(({ info, file, renderer, ...rest }) => ({
      path: file,
      data: { ...info, renderer, ...rest },
      type: "page",
    })),
  } as Source<{
    metaData: never;
    pageData: (typeof documents)[number]["info"] & {
      renderer: (typeof documents)[number]["renderer"];
      [key: string]: unknown;
    };
  }>,
});
