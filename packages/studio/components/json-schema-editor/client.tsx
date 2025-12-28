"use client";
import { type ReactNode, useEffect, useEffectEvent } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchema } from "./schema";
import { FormProvider, useForm } from "react-hook-form";

export interface FormValues {
  value: Record<string, unknown>;
}

export interface JSONSchemaProviderProps extends EditorContextType {
  defaultValues: FormValues;
  children: ReactNode;
  onUpdate: (values: FormValues) => void;
}

export function JSONSchemaEditorProvider({
  children,
  defaultValues,
  onUpdate,
  ...props
}: JSONSchemaProviderProps) {
  const form = useForm<FormValues>({
    defaultValues,
  });
  const onUpdateEvent = useEffectEvent(onUpdate);

  useEffect(() => {
    return form.subscribe({
      formState: {
        values: true,
      },
      callback(data) {
        onUpdateEvent(data.values);
      },
    });
  }, []);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onUpdate)}>
        <SchemaProvider {...props}>{children}</SchemaProvider>
      </form>
    </FormProvider>
  );
}

export function JSONSchemaEditorContent() {
  const { schema } = useSchema();
  const field = useResolvedSchema(schema);
  const fieldName = "value";

  if (field.format === "binary") return <FieldSet field={field} fieldName={fieldName} />;

  return <FieldSet field={field} fieldName={fieldName} collapsible={false} />;
}
