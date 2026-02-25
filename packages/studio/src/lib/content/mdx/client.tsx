"use client";

import { MDXEditor, MDXEditorContainer, MDXEditorView } from "./md-editor";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
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
import {
  JSONSchemaEditorProvider,
  JSONSchemaEditorContent,
} from "@/components/json-schema-editor/client";

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
      <Tabs defaultValue={jsonSchema ? "visual" : "code"} className="mt-4 mb-2">
        <TabsList className="mx-3.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">YAML</TabsTrigger>
        </TabsList>
        {jsonSchema && (
          <TabsContent value="visual">
            <JSONSchemaEditorProvider yjs={{ field: "frontmatter" }} schema={jsonSchema}>
              <JSONSchemaEditorContent className="*:first:hidden [&>div]:border-l-0 [&>div]:border-r-0 [&>div]:rounded-none [&>div]:bg-card/50 [&>div]:p-4" />
            </JSONSchemaEditorProvider>
          </TabsContent>
        )}
        <TabsContent value="code">
          <EditorSuspense>
            <YamlCodeEditor field="frontmatter" className="rounded-none border-l-0 border-r-0" />
          </EditorSuspense>
        </TabsContent>
      </Tabs>
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
      <StatusBar />
    </HocuspocusContextProvider>
  );
}
