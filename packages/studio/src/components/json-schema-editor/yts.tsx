"use client";
import { ComponentProps, useEffect, useEffectEvent, useMemo, type ReactNode } from "react";
import { FieldSet } from "./components/inputs";
import { SchemaProvider, EditorContextType, useResolvedSchema, useSchemaContext } from "./schema";
import { StfProvider, useListener, useStf } from "@fumari/stf";
import { useHocuspocusProvider, useIsSync } from "@/lib/yjs/provider";
import { bind } from "mutative-yjs";
import { objectSet } from "@fumari/stf/lib/utils";
import { dump } from "js-yaml";
import type * as Y from "yjs";

export interface JSONSchemaProviderWithYjsProps extends EditorContextType {
  field: string;
  children: ReactNode;
}

export function JSONSchemaEditorProviderWithYjs({
  children,
  field,
  ...rest
}: JSONSchemaProviderWithYjsProps) {
  const provider = useHocuspocusProvider();
  const isSync = useIsSync();
  const ydata = provider.document.getMap(field);
  const binder = useMemo(() => bind(ydata), [ydata]);
  const stf = useStf({});

  const onDataUpdate = useEffectEvent((_events: Y.YEvent<any>[], t: Y.Transaction) => {
    if (t.local) {
      const ytext = provider.document.getText(`${field}:text`);
      const str = dump(ydata.toJSON());

      if (ytext.toString() === str) return;
      provider.document.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, str);
      });
    } else {
      stf.dataEngine.update([], ydata.toJSON(), { custom: { remote: true } });
    }
  });

  useEffect(() => {
    if (!isSync) return;

    stf.dataEngine.update([], ydata.toJSON(), { custom: { remote: true } });
    ydata.observeDeep(onDataUpdate);
    return () => {
      ydata.unobserveDeep(onDataUpdate);
      binder.unbind();
    };
  }, [isSync, binder, ydata, stf]);

  useListener({
    stf,
    onUpdate(key, { custom }) {
      if (custom?.remote) return;

      binder.update((s) => {
        objectSet(s, key, stf.dataEngine.get(key));
      });
    },
    onDelete(key) {
      binder.update((s) => {
        objectSet(s, key, undefined);
      });
    },
  });

  return (
    <StfProvider value={stf}>
      <SchemaProvider {...rest}>{children}</SchemaProvider>
    </StfProvider>
  );
}

export function JSONSchemaEditorContent(props: Partial<ComponentProps<typeof FieldSet>>) {
  const { schema } = useSchemaContext()!;
  const field = useResolvedSchema(schema);

  if (field.format === "binary") return <FieldSet field={field} fieldName={[]} {...props} />;
  return <FieldSet field={field} fieldName={[]} collapsible={false} {...props} />;
}
