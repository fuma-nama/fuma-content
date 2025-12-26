"use client";

import { MDXEditor } from "@/components/editor/md";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import grayMatter from "gray-matter";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { saveCollectionEntry } from "@/lib/actions";

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
    <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
      <TabsList>
        <TabsTrigger value="frontmatter">Frontmatter</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
      </TabsList>
      <TabsContent value="frontmatter" className="flex-1 overflow-auto">
        <JSONSchemaEditorProvider
          schema={jsonSchema}
          defaultValues={{ value: defaultFrontmatter }}
          onSave={async (frontmatter: { value: Record<string, unknown> }) => {
            await saveCollectionEntry(collection, {
              id,
              value: grayMatter.stringify(defaultValue, frontmatter.value),
            });
          }}
          writeOnly
          readOnly={false}
        >
          <JSONSchemaEditorContent />
        </JSONSchemaEditorProvider>
      </TabsContent>
      <TabsContent value="content" className="flex-1 min-h-0">
        <MDXEditor defaultValue={defaultValue} />
      </TabsContent>
    </Tabs>
  );
}
