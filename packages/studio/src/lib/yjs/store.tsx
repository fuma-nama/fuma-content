import { applyJsonObject } from "mutative-yjs";
import { DocumentItem, validateCollections, validateDocuments } from ".";
import { useHocuspocusProvider, useIsSync } from "./provider";
import * as Y from "yjs";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { deleteDocumentAction } from "../content/actions";

export function useCollections() {
  const doc = useHocuspocusProvider().document;
  return useValue(doc.getArray("collections"), (t) => validateCollections(t.toJSON()));
}

export function useDocuments() {
  const doc = useHocuspocusProvider().document;
  return useValue(doc.getArray("documents"), (t) => validateDocuments(t.toJSON()));
}

export function useValue<T extends Y.AbstractType<any>, R>(t: T, get: (t: T) => R): R | null {
  const isSync = useIsSync();
  const [value, setValue] = useState<R | null>(() => (isSync ? get(t) : null));
  const prevSync = useRef(isSync);

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

  if (prevSync.current !== isSync) {
    prevSync.current = isSync;
    if (isSync) {
      setValue(get(t));
      return null;
    }
  }

  return value;
}

export async function deleteDocument(doc: Y.Doc, collectionId: string, documentId: string) {
  await deleteDocumentAction(documentId, collectionId);

  const ydocuments = doc.getArray("documents");
  const docs = validateDocuments(ydocuments.toJSON());
  const idx = docs.findIndex((doc) => doc.collectionId === collectionId && doc.id === documentId);
  if (idx !== -1) ydocuments.delete(idx, 1);
}

export function insertDocument(doc: Y.Doc, item: DocumentItem) {
  const ydocuments = doc.getArray("documents");
  const docs = validateDocuments(ydocuments.toJSON());

  // exists
  if (docs.some((doc) => doc.id === item.id && doc.collectionId === item.collectionId)) return;

  const yitem = new Y.Map();
  applyJsonObject(yitem, item as never);
  ydocuments.push([yitem]);
}
