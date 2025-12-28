"use client";

import { MDXEditor, MDXEditorContainer, MDXEditorView } from "@/components/editor/md";
import grayMatter from "gray-matter";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { saveCollectionEntry } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditorLazy } from "@/components/code-editor/yaml.lazy";
import { useRef, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon, CircleIcon } from "lucide-react";
import { MDXCodeEditorLazy } from "@/components/code-editor/mdx.lazy";

interface MDXEditorWithFormProps {
  collection: string;
  id: string;

  jsonSchema?: JSONSchema;
  content: string;
  frontmatter?: Record<string, unknown>;
}

/**
 * Combined MDX editor with frontmatter form using JSON Schema
 */
export function MDXEditorWithForm({
  id,
  jsonSchema,
  content: defaultContent,
  frontmatter: defaultFrontmatter = {},
  collection,
}: MDXEditorWithFormProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"sync" | "updated">("sync");
  const timerRef = useRef<number | null>(null);
  const currentValue = useRef<{ frontmatter: Record<string, unknown>; content: string }>({
    frontmatter: defaultFrontmatter,
    content: defaultContent,
  });

  const onSync = (syncAction?: () => void) => {
    if (isPending) return;
    setStatus("updated");

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      startTransition(async () => {
        syncAction?.();
        const { frontmatter, content } = currentValue.current;
        await saveCollectionEntry(collection, {
          id,
          value: grayMatter.stringify(content, frontmatter),
        });
        setStatus("sync");
      });
    }, 500);
  };

  const statusBar = (
    <div className="sticky bottom-2 rounded-full bg-popover text-xs text-popover-foreground inline-flex items-center gap-1 px-3 py-1.5 border shadow-lg z-20 mx-auto">
      {isPending ? (
        <>
          <Spinner className="text-primary" />
          <span className="text-muted-foreground">Saving</span>
        </>
      ) : status === "sync" ? (
        <>
          <CheckIcon className="size-4 text-green-400" />
          <span>In Sync</span>
        </>
      ) : (
        <>
          <CircleIcon className="size-4 fill-current stroke-transparent text-orange-400" />
          <p>Updated</p>
        </>
      )}
    </div>
  );
  const mdxEditor = (
    <MDXEditor
      defaultValue={defaultContent}
      onUpdate={(options) => {
        onSync(() => {
          currentValue.current.content = options.getMarkdown();
        });
      }}
    >
      <MDXEditorContainer className="[--toolbar-offset:--spacing(12)]">
        <MDXEditorView />
      </MDXEditorContainer>
    </MDXEditor>
  );

  if (!jsonSchema) {
    return (
      <>
        {mdxEditor}
        {statusBar}
      </>
    );
  }

  return (
    <>
      <Tabs defaultValue="visual">
        <TabsList>
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="-mt-6">
          <JSONSchemaEditorProvider
            schema={jsonSchema}
            defaultValue={defaultFrontmatter}
            onValueChange={(value) => {
              onSync(() => {
                currentValue.current.frontmatter = value as Record<string, unknown>;
              });
            }}
            writeOnly
            readOnly={false}
          >
            <JSONSchemaEditorContent />
          </JSONSchemaEditorProvider>
        </TabsContent>
        <TabsContent value="code">
          <YamlEditorLazy
            defaultValue={defaultFrontmatter}
            onValueChange={(value) => {
              onSync(() => {
                currentValue.current.frontmatter = value as Record<string, unknown>;
              });
            }}
          />
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="visual" className="flex-1">
        <TabsList>
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="visual">{mdxEditor}</TabsContent>
        <TabsContent value="code" className="size-full">
          <MDXCodeEditorLazy defaultValue={defaultContent} onValueChange={() => null} />
        </TabsContent>
      </Tabs>

      {statusBar}
    </>
  );
}
