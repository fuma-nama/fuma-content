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
  content: defaultValue,
  frontmatter: defaultFrontmatter = {},
  collection,
}: MDXEditorWithFormProps) {
  if (!jsonSchema) {
    return <MDXEditor defaultValue={defaultValue} />;
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <JSONSchemaEditorProvider
        schema={jsonSchema}
        defaultValues={{ value: defaultFrontmatter }}
        onSave={async ({ value }) => {
          await saveCollectionEntry(collection, {
            id,
            value: grayMatter.stringify(defaultValue, value),
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

      <MDXEditor defaultValue={defaultValue} />
    </div>
  );
}
