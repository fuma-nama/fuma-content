"use client";

import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditorLazy } from "@/components/code-editor/yaml.lazy";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientContext } from "..";
import { StatusBar } from "@/components/edit/status-bar";
import { useSync } from "@/components/edit/use-sync";
import { createDataDocument, saveDataDocument } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataDocEditProps {
  collectionId: string;
  documentId: string;

  jsonSchema?: JSONSchema;
  data: unknown;
}

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

export function DataDocEdit({ collectionId, documentId, ...rest }: DataDocEditProps) {
  return (
    <DocEditor
      {...rest}
      onSync={(data) => {
        return saveDataDocument({ collectionId, documentId, data });
      }}
    />
  );
}

function DocEditor({
  jsonSchema,
  data: defaultData,
  onSync: onSyncCallback,
}: {
  jsonSchema?: JSONSchema;
  data: unknown;
  onSync: (data: unknown) => void | Promise<void>;
}) {
  const currentValue = useRef({
    data: defaultData,
  });
  const { onSync, status } = useSync(() => {
    return onSyncCallback(currentValue.current.data);
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
              defaultValue={currentValue.current.data}
              onValueChange={(value) => {
                onSync(() => {
                  currentValue.current.data = value;
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
            defaultValue={currentValue.current.data}
            onValueChange={(value) => {
              onSync(() => {
                currentValue.current.data = value;
              });
            }}
          />
        </TabsContent>
      </Tabs>

      <StatusBar status={status} />
    </>
  );
}
