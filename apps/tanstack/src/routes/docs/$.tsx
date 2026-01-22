import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { source } from "@/lib/source";
import { docs } from "content/docs.browser";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { useRenderer } from "fuma-content/collections/mdx/runtime-browser";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    await docs.get(data.id)?.preload();
    return data;
  },
});

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      id: page.data.id,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

function Page() {
  const data = Route.useLoaderData();
  const { pageTree } = useFumadocsLoader(data);
  const node = useRenderer(docs.get(data.id), ({ frontmatter, default: MDX }) => {
    return (
      <DocsPage>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
            }}
          />
        </DocsBody>
      </DocsPage>
    );
  });

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      {node}
    </DocsLayout>
  );
}
