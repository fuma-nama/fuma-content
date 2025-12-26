"use client";

import { MDXEditor } from "@/components/editor/md";
import grayMatter from "gray-matter";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { saveCollectionEntry } from "@/lib/actions";
import { toast } from "sonner";

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
          toast.success("Frontmatter Saved");
        }}
        writeOnly
        readOnly={false}
      >
        <JSONSchemaEditorContent />
      </JSONSchemaEditorProvider>
      <MDXEditor defaultValue={defaultValue} />
    </div>
  );
}
