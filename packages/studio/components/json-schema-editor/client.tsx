"use client";
import { type ReactNode, useState } from "react";
import { FieldSet, JsonInput } from "./components/inputs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchema } from "./schema";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "../ui/button";

export interface FormValues {
  value: Record<string, unknown>;
}

export interface JSONSchemaProviderProps extends EditorContextType {
  defaultValues: FormValues;
  children: ReactNode;
  onSave: (values: FormValues) => void;
}

export function JSONSchemaEditorProvider({
  children,
  defaultValues,
  onSave,
  ...props
}: JSONSchemaProviderProps) {
  const form = useForm<FormValues>({
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          onSave(values);
        })}
      >
        <SchemaProvider {...props}>{children}</SchemaProvider>
        <Button type="submit" className="mt-4">
          Save Frontmatter
        </Button>
      </form>
    </FormProvider>
  );
}

export function JSONSchemaEditorContent() {
  const { schema } = useSchema();
  const field = useResolvedSchema(schema);
  const [isJson, setIsJson] = useState(false);

  if (field.format === "binary") return <FieldSet field={field} fieldName="" />;

  if (isJson)
    return (
      <>
        <button
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "mb-2",
            }),
          )}
          onClick={() => setIsJson(false)}
          type="button"
        >
          Close JSON Editor
        </button>
        <JsonInput fieldName="" />
      </>
    );

  return (
    <FieldSet
      field={field}
      fieldName=""
      collapsible={false}
      name={
        <button
          type="button"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
            }),
          )}
          onClick={() => setIsJson(true)}
        >
          Open JSON Editor
        </button>
      }
    />
  );
}
