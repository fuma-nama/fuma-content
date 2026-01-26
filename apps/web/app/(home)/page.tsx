import Link from "next/link";
import { CodeBlock } from "@/components/codeblock";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { cn } from "@/lib/cn";

// language=ts
const config = `import { mdxCollection } from "fuma-content/collections/mdx"
import { dataCollection } from "fuma-content/collections/data"
import git from "fuma-content/plugins/git"
import { defineConfig } from "fuma-content/config"
import { z } from "zod"

const docs = mdxCollection({
  dir: "content/docs",
  frontmatter: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
  lazy: true,
})

const authors = dataCollection({
  dir: "content/docs",
  files: ["authors.json"],
  schema: z.object({
    author: z.array(z.string()),
  }),
})

export default defineConfig({
  collections: {
    docs,
    authors,
  },
  plugins: [git()],
})`;

// language=tsx
const serverCode = `import { docs } from "content/docs"
import { authors } from "content/authors"

for (const file of docs.list()) {
  const { frontmatter, lastModified } = file.compiled
  // 'lastModified' is obtained from version control
  console.log(\`page: \${frontmatter.title}\`, lastModified)
}

console.log(authors.list())

function Page({ id }: { id: string }) {
  const file = docs.get(id)
  if (!file) return
  
  const { default: MDX } = file.compiled
  
  return <div className='prose'>
    <MDX
      components={{
        h1: props => <h1 {...props} className='text-4xl' />
      }}
    />
  </div>
}`;

// language=tsx
const browserCode = `import { docs } from "content/docs.browser";
import { useRenderer } from "fuma-content/collections/mdx/react";

function Page({ id }: { id: string }) {
  const file = docs.get(id)
  if (!file) return

  const children = useRenderer(file, (compiled) => {
    const { default: MDX } = compiled
    return <MDX />
  })
  
  return <div className='prose'>
    {children}
  </div>
}`;

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-16">
      <h1 className="mb-6 font-semibold text-2xl">Integrate content into your JavaScript app.</h1>
      <p className="mb-6 text-fd-muted-foreground">
        Fuma Content is a <span className="font-medium text-fd-primary">content processing</span>{" "}
        layer, with native support for MDX.js, JSON and YAML files.
      </p>
      <div className="mb-6 flex flex-row items-center gap-2">
        <Link
          href="/docs"
          className={cn(buttonVariants({ variant: "primary", className: "px-4" }))}
        >
          Getting Started
        </Link>
      </div>

      <CodeBlockTabs defaultValue="config">
        <CodeBlockTabsList>
          <CodeBlockTabsTrigger value="config">Config</CodeBlockTabsTrigger>
          <CodeBlockTabsTrigger value="server">Server</CodeBlockTabsTrigger>
          <CodeBlockTabsTrigger value="browser">Browser</CodeBlockTabsTrigger>
        </CodeBlockTabsList>
        <CodeBlockTab value="config">
          <CodeBlock lang="ts" code={config} title="content.config.ts" />
        </CodeBlockTab>
        <CodeBlockTab value="server">
          <CodeBlock lang="tsx" code={serverCode} />
        </CodeBlockTab>
        <CodeBlockTab value="browser">
          <CodeBlock lang="tsx" code={browserCode} />
        </CodeBlockTab>
      </CodeBlockTabs>
    </div>
  );
}
