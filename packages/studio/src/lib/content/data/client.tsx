"use client";

import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientContext } from "..";
import { StatusBar } from "@/components/edit/status-bar";
import { createDataDocument } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditorSuspense } from "@/components/code-editor/suspense";
import { HocuspocusContextProvider } from "@/lib/yjs/provider";
import { encodeDocId } from "@/lib/yjs";
import {
  JSONSchemaEditorProviderWithYjs,
  JSONSchemaEditorContent,
} from "@/components/json-schema-editor/yts";

interface DataDocEditProps {
  collectionId: string;
  documentId: string;
  jsonSchema?: JSONSchema;
}

const YamlCodeEditor = lazy(() =>
  import("@/components/code-editor/yaml").then((mod) => ({ default: mod.YamlEditor })),
);

export const clientContext: ClientContext = {
  dialogs: {
    createDocument({ collection, useDialog }) {
      const { setOpen, onCreate } = useDialog();
      const form = useForm({
        defaultValues: {
          name: "",
          type: collection._data!.formats[0] as "json" | "yaml",
        },
      });

      return (
        <form
          className="flex flex-col gap-2"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const created = await createDataDocument({
                collectionId: collection.id,
                name: values.name,
                type: values.type,
                data: {},
              });
              onCreate(created);
              setOpen(false);
            } catch (e) {
              form.setError("root", { message: Error.isError(e) ? e.message : String(e) });
            }
          })}
        >
          <Label htmlFor="name">Name</Label>
          <div className="flex flex-row gap-2">
            <Input id="name" {...form.register("name")} placeholder="hello-world" />
            <Controller
              name="type"
              control={form.control}
              render={({ field: { value, onChange, ...field } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger {...field}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {collection._data!.formats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

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

export function DataDocEdit({ collectionId, documentId, jsonSchema }: DataDocEditProps) {
  return (
    <HocuspocusContextProvider name={encodeDocId(collectionId, documentId)}>
      <Tabs defaultValue={jsonSchema ? "visual" : "code"}>
        <TabsList className="mx-3.5">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
        </TabsList>
        {jsonSchema && (
          <TabsContent value="visual">
            <JSONSchemaEditorProviderWithYjs
              field="data"
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
            <YamlCodeEditor field="data" className="rounded-none border-l-0 border-r-0" />
          </EditorSuspense>
        </TabsContent>
      </Tabs>

      <StatusBar />
    </HocuspocusContextProvider>
  );
}
