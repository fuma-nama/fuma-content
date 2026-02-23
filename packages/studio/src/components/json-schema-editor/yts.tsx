"use client";
import { ComponentProps, useEffect, useMemo, useRef, type ReactNode } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchemaContext } from "./schema";
import { StfProvider, useListener, useStf } from "@fumari/stf";
import { useHocuspocusProvider, useIsSync } from "@/lib/yjs/provider";
import { bind } from "mutative-yjs";
import { objectSet } from "@fumari/stf/lib/utils";

export interface JSONSchemaProviderWithYjsProps extends EditorContextType {
  field: string;
  children: ReactNode;
}

export function JSONSchemaEditorProviderWithYjs({
  children,
  ...props
}: JSONSchemaProviderWithYjsProps) {
  const provider = useHocuspocusProvider();
  const isSync = useIsSync();
  const ydata = useMemo(() => provider.document.getMap("frontmatter"), [provider]);
  const binder = useMemo(() => bind(ydata), [ydata]);
  const stf = useStf({});
  const blockEventsRef = useRef(false);

  useEffect(() => {
    if (!isSync) return;
    blockEventsRef.current = true;
    stf.dataEngine.reset(ydata.toJSON());
    blockEventsRef.current = false;

    return binder.subscribe(() => {
      blockEventsRef.current = true;
      stf.dataEngine.update([], ydata.toJSON());
      blockEventsRef.current = false;
    });
  }, [isSync, binder]);

  useEffect(() => {
    return () => {
      binder.unbind();
    };
  }, []);

  useListener({
    stf,
    onUpdate(key) {
      if (blockEventsRef.current) return;

      binder.update((s) => {
        console.log("update", s, key, stf.dataEngine.get(key));
        objectSet(s, key, stf.dataEngine.get(key));
      });
    },
  });

  return (
    <StfProvider value={stf}>
      <SchemaProvider {...props}>{children}</SchemaProvider>
    </StfProvider>
  );
}

export function JSONSchemaEditorContent(props: Partial<ComponentProps<typeof FieldSet>>) {
  const { schema } = useSchemaContext()!;
  const field = useResolvedSchema(schema);

  if (field.format === "binary") return <FieldSet field={field} fieldName={[]} {...props} />;
  return <FieldSet field={field} fieldName={[]} collapsible={false} {...props} />;
}
