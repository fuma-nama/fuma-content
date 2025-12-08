import {
  type InferPageType,
  loader,
  type MetaData,
  type Source,
} from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docs } from "content/server";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(mySource(), {
  baseUrl: "/docs",
  plugins: [lucideIconsPlugin()],
});

function mySource(): Source<{
  metaData: MetaData;
  pageData: (typeof docs)[number]["compiled"]["frontmatter"] & {
    compiled: (typeof docs)[number]["compiled"];
  };
}> {
  return {
    files: docs.map((doc) => ({
      type: "page",
      path: doc.path,
      absolutePath: doc.fullPath,
      data: {
        ...doc.compiled.frontmatter,
        compiled: doc.compiled,
      },
    })),
  } satisfies Source;
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
