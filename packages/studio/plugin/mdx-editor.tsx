"use client";

import { MDXEditor } from "@/components/editor/md";
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

  if (!jsonSchema) {
    return (
      <>
        <MDXEditor
          defaultValue={defaultContent}
          onUpdate={(options) => {
            onSync(() => {
              currentValue.current.content = options.getMarkdown();
            });
          }}
        />
        {statusBar}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <JSONSchemaEditorProvider
        schema={jsonSchema}
        defaultValues={{ value: defaultFrontmatter }}
        onUpdate={({ value }) => {
          onSync(() => {
            currentValue.current.frontmatter = value;
          });
        }}
        writeOnly
        readOnly={false}
      >
        <Tabs defaultValue="visual">
          <TabsList>
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="yaml">YAML Editor</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="-mt-6">
            <JSONSchemaEditorContent />
          </TabsContent>
          <TabsContent value="yaml">
            <YamlEditorLazy fieldName="value" />
          </TabsContent>
        </Tabs>
      </JSONSchemaEditorProvider>

      <MDXEditor
        defaultValue={defaultContent}
        onUpdate={(options) => {
          onSync(() => {
            currentValue.current.content = options.getMarkdown();
          });
        }}
      />
      {statusBar}
    </div>
  );
}
