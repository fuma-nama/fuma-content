"use client";

import {
  MDXEditor,
  MDXEditorContainer,
  MDXEditorSuspense,
  MDXEditorView,
} from "@/components/editor/md";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditorLazy } from "@/components/code-editor/yaml.lazy";
import { useRef } from "react";
import { MDXCodeEditorLazy } from "@/components/code-editor/mdx.lazy";
import { createMDXDocument, saveMDXDocument } from "./actions";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientContext } from "..";
import { StatusBar } from "@/components/edit/status-bar";
import { useSync } from "@/components/edit/use-sync";

interface MDXDocUpdateEditorProps {
  collectionId: string;
  documentId: string;

  jsonSchema?: JSONSchema;
  content: string;
  frontmatter?: Record<string, unknown>;
}

export const clientContext: ClientContext = {
  dialogs: {
    createDocument({ collection, useDialog }) {
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
            try {
              const created = await createMDXDocument({
                collectionId: collection.id,
                name: values.name,
                content: "",
              });
              onCreate(created);
              setOpen(false);
            } catch (e) {
              form.setError("root", { message: Error.isError(e) ? e.message : String(e) });
            }
          })}
        >
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} placeholder="hello-world" />

          <Button type="submit" className="mt-4">
            Create
          </Button>
          <p className="text-destructive text-sm empty:hidden">
            {form.formState.errors.root?.message}
          </p>
        </form>
      );
    },
  },
};

export function MDXDocUpdateEditor({ collectionId, documentId, ...rest }: MDXDocUpdateEditorProps) {
  return (
    <MDXDocEditor
      {...rest}
      onSync={(frontmatter, content) => {
        return saveMDXDocument({
          collectionId,
          documentId,
          frontmatter,
          content,
        });
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
  onSync: (frontmatter: Record<string, unknown>, content: string) => void | Promise<void>;
}) {
  const currentValue = useRef<{ frontmatter: Record<string, unknown>; content: string }>({
    frontmatter: defaultFrontmatter,
    content: defaultContent,
  });
  const { onSync, status } = useSync(() => {
    const { frontmatter, content } = currentValue.current;
    return onSyncCallback(frontmatter, content);
  });

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
              defaultValue={currentValue.current.frontmatter}
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
            defaultValue={currentValue.current.frontmatter}
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
          <MDXEditorSuspense>
            <MDXEditor
              defaultValue={currentValue.current.content}
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
          </MDXEditorSuspense>
        </TabsContent>
        <TabsContent value="code" className="size-full">
          <MDXCodeEditorLazy
            defaultValue={currentValue.current.content}
            onValueChange={(v) => {
              onSync(() => {
                currentValue.current.content = v;
              });
            }}
          />
        </TabsContent>
      </Tabs>
      <StatusBar status={status} />
    </>
  );
}
