"use client";
import { type ReactNode, useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchema } from "./schema";
import { FormProvider, useForm } from "react-hook-form";
import { Spinner } from "../ui/spinner";
import { CheckIcon, CircleIcon } from "lucide-react";

export interface FormValues {
  value: Record<string, unknown>;
}

export interface JSONSchemaProviderProps extends EditorContextType {
  defaultValues: FormValues;
  children: ReactNode;
  onSave: (values: FormValues) => void | Promise<void>;
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
  const [status, setStatus] = useState<"sync" | "updated">("sync");
  const timerRef = useRef<number | undefined>(undefined);

  const onUpdate = useEffectEvent((values: FormValues) => {
    if (isPending) return;
    setStatus("updated");

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      startTransition(async () => {
        await onSave(values);
        setStatus("sync");
      });
    }, 500);
  });

  useEffect(() => {
    return form.subscribe({
      formState: {
        values: true,
      },
      callback(data) {
        onUpdate(data.values);
      },
    });
  }, []);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onUpdate)}>
        <SchemaProvider {...props}>{children}</SchemaProvider>
        {isPending ? (
          <p className="inline-flex items-center gap-1 text-muted-foreground text-xs mt-2">
            <Spinner />
            Saving
          </p>
        ) : status === "sync" ? (
          <p className="inline-flex items-center gap-1 text-green-400 text-xs mt-2">
            <CheckIcon className="size-4" />
            In Sync
          </p>
        ) : (
          <p className="inline-flex items-center gap-1 text-orange-400 text-xs mt-2">
            <CircleIcon className="size-4 fill-current stroke-transparent" />
            Updated
          </p>
        )}
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
