"use client";

import { MDXEditor, MDXEditorContainer, MDXEditorView } from "./md-editor";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditorLazy } from "@/components/code-editor/yaml.lazy";
import { Suspense, useRef } from "react";
import { MDXCodeEditorLazy } from "@/components/code-editor/mdx.lazy";
import { createMDXDocument, saveMDXDocument } from "./actions";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientContext } from "..";
import { StatusBar } from "@/components/edit/status-bar";
import { useSync } from "@/components/edit/use-sync";
import { Spinner } from "@/components/ui/spinner";

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

export function MDXDocUpdateEditor({
  collectionId,
  documentId,
  content: defaultContent,
  frontmatter: defaultFrontmatter = {},
  jsonSchema,
}: MDXDocUpdateEditorProps) {
  const currentValue = useRef<{ frontmatter: Record<string, unknown>; content: string }>({
    frontmatter: defaultFrontmatter,
    content: defaultContent,
  });
  const { onSync, status } = useSync(() => {
    const { frontmatter, content } = currentValue.current;
    return saveMDXDocument({
      collectionId,
      documentId,
      frontmatter,
      content,
    });
  });

  return (
    <>
      <Tabs defaultValue={jsonSchema ? "visual" : "code"} className="mt-4">
        <TabsList className="mx-1.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        {jsonSchema && (
          <TabsContent value="visual">
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
              <JSONSchemaEditorContent className="*:first:hidden [&>div]:border-l-0 [&>div]:border-r-0 [&>div]:rounded-none [&>div]:bg-card/50 [&>div]:px-4" />
            </JSONSchemaEditorProvider>
          </TabsContent>
        )}
        <TabsContent value="code">
          <YamlEditorLazy
            defaultValue={currentValue.current.frontmatter}
            className="rounded-none border-l-0 border-r-0"
            onValueChange={(value) => {
              onSync(() => {
                currentValue.current.frontmatter = value as Record<string, unknown>;
              });
            }}
          />
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="visual" className="mt-4 flex-1">
        <TabsList className="mx-1.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="flex flex-col size-full">
          <Suspense
            fallback={
              <div className="flex items-center gap-2 text-muted-foreground bg-muted border-y p-3">
                <Spinner />
                Loading Editor
              </div>
            }
          >
            <MDXEditor
              documentId={documentId}
              defaultValue={currentValue.current.content}
              onUpdate={(options) => {
                onSync(() => {
                  currentValue.current.content = options.getMarkdown();
                });
              }}
            >
              <MDXEditorContainer className="border-0 border-t rounded-none flex-1 [--toolbar-offset:--spacing(10)]">
                <MDXEditorView />
              </MDXEditorContainer>
            </MDXEditor>
          </Suspense>
        </TabsContent>
        <TabsContent value="code" className="flex flex-col size-full">
          <MDXCodeEditorLazy
            defaultValue={currentValue.current.content}
            className="rounded-none border-0 border-t flex-1"
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
