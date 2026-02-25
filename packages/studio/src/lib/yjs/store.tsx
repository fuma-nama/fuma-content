import { applyJsonObject } from "mutative-yjs";
import { DocumentItem, validateCollections, validateDocuments } from ".";
import { useHocuspocusProvider, useIsSync } from "./provider";
import * as Y from "yjs";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { deleteDocumentAction } from "../data/actions";

export function useCollections() {
  const doc = useHocuspocusProvider().document;
  return useValue(doc.getArray("collections"), (t) => validateCollections(t.toJSON()));
}

export function useDocuments() {
  const doc = useHocuspocusProvider().document;
  return useValue(doc.getArray("documents"), (t) => validateDocuments(t.toJSON()));
}

export function useValue<T extends Y.AbstractType<any>, R>(t: T, get: (t: T) => R): R {
  const isSync = useIsSync();
  const [value, setValue] = useState<R>(() => get(t));
  const prevSync = useRef(isSync);

  if (prevSync.current !== isSync) {
    prevSync.current = isSync;
    if (isSync) setValue(get(t));
  }

  const onChange = useEffectEvent(() => {
    setValue(get(t));
  });

  useEffect(() => {
    if (!isSync) return;

    t.observe(onChange);
    return () => {
      t.unobserve(onChange);
    };
  }, [t, isSync]);

  return value;
}

export async function deleteDocument(doc: Y.Doc, collectionId: string, documentId: string) {
  await deleteDocumentAction(documentId, collectionId);

  const ydocuments = doc.getArray("documents");
  const idx = validateDocuments(ydocuments.toJSON()).findIndex(
    (doc) => doc.collectionId === collectionId && doc.id === documentId,
  );
  ydocuments.delete(idx);
}

export function insertDocument(doc: Y.Doc, item: DocumentItem) {
  const ydocuments = doc.getArray("documents");
  const yitem = new Y.Map();
  applyJsonObject(yitem, item as never);
  ydocuments.push([yitem]);
}
