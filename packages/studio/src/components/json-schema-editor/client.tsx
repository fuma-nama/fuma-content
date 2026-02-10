"use client";
import { type ReactNode } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchemaContext } from "./schema";
import { StfProvider, useListener, useStf } from "@fumari/stf";

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
  const stf = useStf({
    defaultValues: defaultValue as never,
  });

  useListener({
    stf,
    onUpdate() {
      onValueChange(stf.dataEngine.getData());
    },
  });

  return (
    <StfProvider value={stf}>
      <SchemaProvider {...props}>{children}</SchemaProvider>
    </StfProvider>
  );
}

export function JSONSchemaEditorContent() {
  const { schema } = useSchemaContext()!;
  const field = useResolvedSchema(schema);

  if (field.format === "binary") return <FieldSet field={field} fieldName={[]} />;
  return <FieldSet field={field} fieldName={[]} collapsible={false} />;
}
