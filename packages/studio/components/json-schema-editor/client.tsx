"use client";
import { type ReactNode, useState, useTransition } from "react";
import { FieldSet, JsonInput } from "./components/inputs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchema } from "./schema";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

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
  const [isPending, startTransition] = useTransition();

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          return startTransition(() => onSave(values));
        })}
      >
        <SchemaProvider {...props}>{children}</SchemaProvider>
        <Button type="submit" className="mt-4 justify-start pe-8" disabled={isPending}>
          <Spinner className={cn(!isPending && "invisible")} />
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
  const fieldName = "value";

  if (field.format === "binary") return <FieldSet field={field} fieldName={fieldName} />;

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
        <JsonInput fieldName={fieldName} />
      </>
    );

  return (
    <FieldSet
      field={field}
      fieldName={fieldName}
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
