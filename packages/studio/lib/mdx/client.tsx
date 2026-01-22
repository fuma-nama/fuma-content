"use client";

import { MDXEditor, MDXEditorContainer, MDXEditorView } from "@/components/editor/md";
import grayMatter from "gray-matter";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditorLazy } from "@/components/code-editor/yaml.lazy";
import { useRef, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon, CircleIcon } from "lucide-react";
import { MDXCodeEditorLazy } from "@/components/code-editor/mdx.lazy";
import { createMDXDocument, saveMDXDocument } from "./actions";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { removeUndefined } from "@/lib/utils/remove-undefined";
import { ClientContext } from "..";

interface MDXDocUpdateEditorProps {
  collectionId: string;
  documentId: string;

  jsonSchema?: JSONSchema;
  content: string;
  frontmatter?: Record<string, unknown>;
}

export const clientContext: ClientContext = {
  dialogs: {
    createDocument({ collectionId, useDialog }) {
      const { setOpen, onCreate } = useDialog();
      const form = useForm({
        defaultValues: {
          name: "",
        },
      });

      return (
        <form
          className="flex flex-col gap-2"
          onSubmit={form.handleSubmit(async (values) => {
            const created = await createMDXDocument(collectionId, values.name, "");
            onCreate(created);
            setOpen(false);
          })}
        >
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} placeholder="hello-world" />

          <Button type="submit" className="mt-4">
            Create
          </Button>
        </form>
      );
    },
  },
};

export function MDXDocUpdateEditor({ collectionId, documentId, ...rest }: MDXDocUpdateEditorProps) {
  return (
    <MDXDocEditor
      {...rest}
      onSync={(content) => {
        return saveMDXDocument(collectionId, documentId, content);
      }}
    />
  );
}

/**
 * Combined MDX editor with frontmatter form using JSON Schema
 */
function MDXDocEditor({
  jsonSchema,
  content: defaultContent,
  frontmatter: defaultFrontmatter = {},
  onSync: onSyncCallback,
}: {
  jsonSchema?: JSONSchema;
  content: string;
  frontmatter?: Record<string, unknown>;
  onSync: (value: string) => void | Promise<void>;
}) {
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
        await onSyncCallback(grayMatter.stringify(content, removeUndefined(frontmatter, true)));
        setStatus("sync");
      });
    }, 500);
  };

  return (
    <>
      <Tabs defaultValue={jsonSchema ? "visual" : "code"}>
        <TabsList>
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        {jsonSchema && (
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
        )}
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
        <TabsContent value="visual">
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
        </TabsContent>
        <TabsContent value="code" className="size-full">
          <MDXCodeEditorLazy defaultValue={defaultContent} onValueChange={() => null} />
        </TabsContent>
      </Tabs>

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
    </>
  );
}
