"use client";

import { MDXEditor, MDXEditorContainer, MDXEditorView } from "./md-editor";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
import { createMDXDocument } from "./actions";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientContext } from "..";
import { EditorFallback, EditorSuspense } from "@/components/code-editor/suspense";
import { HocuspocusContextProvider } from "@/lib/yjs/provider";
import { encodeDocId } from "@/lib/yjs";
import { StatusBar } from "@/components/edit/status-bar";
import { JSONSchemaEditorProviderWithYjs } from "@/components/json-schema-editor/yts";

const MdxCodeEditor = lazy(() =>
  import("@/components/code-editor/mdx").then((mod) => ({ default: mod.MDXCodeEditor })),
);

const YamlCodeEditor = lazy(() =>
  import("@/components/code-editor/yaml").then((mod) => ({ default: mod.YamlEditor })),
);

interface MDXDocUpdateEditorProps {
  collectionId: string;
  documentId: string;
  jsonSchema?: JSONSchema;
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
  jsonSchema,
}: MDXDocUpdateEditorProps) {
  return (
    <HocuspocusContextProvider name={encodeDocId(collectionId, documentId)}>
      <Tabs defaultValue={jsonSchema ? "visual" : "code"} className="mt-4">
        <TabsList className="mx-3.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        {jsonSchema && (
          <TabsContent value="visual">
            <JSONSchemaEditorProviderWithYjs
              field="frontmatter"
              schema={jsonSchema}
              writeOnly
              readOnly={false}
            >
              <JSONSchemaEditorContent className="*:first:hidden [&>div]:border-l-0 [&>div]:border-r-0 [&>div]:rounded-none [&>div]:bg-card/50 [&>div]:p-4" />
            </JSONSchemaEditorProviderWithYjs>
          </TabsContent>
        )}
        <TabsContent value="code">
          <EditorSuspense>
            <YamlCodeEditor
              field="frontmatter:text"
              className="rounded-none border-l-0 border-r-0"
            />
          </EditorSuspense>
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="visual" className="mt-4 flex-1">
        <TabsList className="mx-3.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="flex flex-col size-full">
          <MDXEditor>
            {({ ready }) =>
              ready ? (
                <MDXEditorContainer className="border-0 border-t rounded-none flex-1 [--toolbar-offset:--spacing(10)]">
                  <MDXEditorView />
                </MDXEditorContainer>
              ) : (
                <EditorFallback />
              )
            }
          </MDXEditor>
        </TabsContent>
        <TabsContent value="code" className="flex flex-col size-full">
          <EditorSuspense>
            <MdxCodeEditor
              field="content:text"
              className="rounded-none border-0 border-t flex-1"
              wrapperProps={{
                className: "flex-1",
              }}
            />
          </EditorSuspense>
        </TabsContent>
      </Tabs>
      <StatusBar />
    </HocuspocusContextProvider>
  );
}
