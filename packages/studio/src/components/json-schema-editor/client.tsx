"use client";
import { type ComponentProps, useEffect, useEffectEvent, useMemo } from "react";
import { FieldSet } from "./components/inputs";
import {
  EditorProvider,
  useResolvedSchema,
  useEditorContext,
  EditorContextProps,
  YjsContext,
} from "./schema";
import { StfProvider, useDataEngine, useListener, useStf } from "@fumari/stf";
import { useHocuspocusProvider, useIsSync } from "@/lib/yjs/provider";
import { bind } from "mutative-yjs";
import type * as Y from "yjs";
import { dump } from "js-yaml";
import { objectSet } from "@fumari/stf/lib/utils";

export interface JSONSchemaProviderProps extends EditorContextProps {
  defaultValue?: unknown;
  onValueChange?: (value: unknown) => void;
}

export function JSONSchemaEditorProvider(props: JSONSchemaProviderProps) {
  return props.yjs ? (
    <ProviderWithYjs {...(props as JSONSchemaProviderProps & { yjs: YjsContext })} />
  ) : (
    <Provider {...props} />
  );
}

function Provider({ children, defaultValue, onValueChange, ...props }: JSONSchemaProviderProps) {
  const stf = useStf({
    defaultValues: defaultValue as never,
  });

  useListener({
    stf,
    onUpdate() {
      if (onValueChange) onValueChange(stf.dataEngine.getData());
    },
  });

  return (
    <StfProvider value={stf}>
      <EditorProvider {...props}>{children}</EditorProvider>
    </StfProvider>
  );
}

function ProviderWithYjs({
  children,
  defaultValue: _,
  onValueChange,
  ...props
}: JSONSchemaProviderProps & { yjs: YjsContext }) {
  const { field } = props.yjs;
  const provider = useHocuspocusProvider();
  const isSync = useIsSync();
  const ydata = provider.document.getMap(field);
  const binder = useMemo(() => bind(ydata), [ydata]);
  const stf = useStf({
    defaultValues: () => ydata.toJSON(),
  });
  const engine = stf.dataEngine;

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
      engine.update([], ydata.toJSON(), { custom: { remote: true } });
    }
  });

  useEffect(() => {
    if (!isSync) return;

    engine.update([], ydata.toJSON(), { custom: { remote: true } });
    ydata.observeDeep(onDataUpdate);
    return () => {
      ydata.unobserveDeep(onDataUpdate);
    };
  }, [isSync, ydata, engine]);

  useEffect(() => {
    return () => {
      binder.unbind();
    };
  }, []);

  useListener({
    stf,
    onUpdate(key, { custom }) {
      if (custom?.remote) return;
      if (onValueChange) onValueChange(stf.dataEngine.getData());

      binder.update((s) => {
        objectSet(s, key, engine.get(key));
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
      <EditorProvider {...props}>{children}</EditorProvider>
    </StfProvider>
  );
}

export function JSONSchemaEditorContent(props: Partial<ComponentProps<typeof FieldSet>>) {
  const { schema } = useEditorContext();
  const field = useResolvedSchema(schema);

  if (field.format === "binary") return <FieldSet field={field} fieldName={[]} {...props} />;
  return <FieldSet field={field} fieldName={[]} collapsible={false} {...props} />;
}
