"use client";
import { type ReactNode, useEffect, useEffectEvent } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchema } from "./schema";
import { FormProvider, useForm } from "react-hook-form";

interface FormValues {
  value: unknown;
}

export interface JSONSchemaProviderProps extends EditorContextType {
  children: ReactNode;
  defaultValue: unknown;
  onValueChange: (value: unknown) => void;
}

export function JSONSchemaEditorProvider({
  children,
  defaultValue,
  onValueChange,
  ...props
}: JSONSchemaProviderProps) {
  const form = useForm<FormValues>({
    defaultValues: { value: defaultValue },
  });
  const onUpdateEvent = useEffectEvent(onValueChange);

  useEffect(() => {
    return form.subscribe({
      formState: {
        values: true,
      },
      callback(data) {
        onUpdateEvent(data.values.value);
      },
    });
  }, []);

  return (
    <FormProvider {...form}>
      <SchemaProvider {...props}>{children}</SchemaProvider>
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
