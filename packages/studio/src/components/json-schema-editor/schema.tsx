import { Ajv2020 } from "ajv/dist/2020";
import { createContext, ReactNode, use, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getDefaultValue } from "./get-default-values";
import { mergeAllOf } from "./utils/merge-schema";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";

export interface SchemaContextType extends EditorContextType {
  /**
   * client-side attached state of a specific field
   */
  fieldInfoMap: Map<string, FieldInfo>;
  ajv: Ajv2020;
}

export interface EditorContextType {
  schema: JSONSchema;

  /**
   * show write only fields
   */
  writeOnly: boolean;

  /**
   * show read only fields
   */
  readOnly: boolean;
}

type UnionField = "anyOf" | "oneOf";

export interface FieldInfo {
  selectedType?: string;
  oneOf: number;

  /**
   * The actual field that represents union members.
   */
  unionField?: UnionField;

  intersection?: {
    merged: Exclude<JSONSchema, boolean>;
  };
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);
export const anyFields = {
  type: ["string", "number", "boolean", "array", "object"],
  items: true,
  additionalProperties: true,
} satisfies JSONSchema;

export function SchemaProvider({
  schema,
  readOnly,
  writeOnly,
  children,
}: EditorContextType & { children: ReactNode }) {
  const fieldInfoMap = useMemo(() => new Map<string, FieldInfo>(), []);
  const ajv = useMemo(
    () =>
      new Ajv2020({
        strict: false,
        validateSchema: false,
        validateFormats: false,
        schemas: [schema],
      }),
    [schema],
  );

  return (
    <SchemaContext
      value={useMemo(
        () => ({ schema, fieldInfoMap, ajv, readOnly, writeOnly }),
        [schema, fieldInfoMap, ajv, readOnly, writeOnly],
      )}
    >
      {children}
    </SchemaContext>
  );
}

export function useSchema(): SchemaContextType {
  return use(SchemaContext)!;
}

/**
 * A hook to store dynamic info of a field, such as selected schema of `oneOf`.
 *
 * @param fieldName - field name of form.
 * @param schema - The JSON Schema to generate initial values.
 * @param depth - The depth to avoid duplicated field name with same schema (e.g. nested `oneOf`).
 */
export function useFieldInfo(
  fieldName: string,
  schema: Exclude<JSONSchema, boolean>,
  depth: number,
): {
  info: FieldInfo;
  updateInfo: (value: Partial<FieldInfo>) => void;
} {
  const { fieldInfoMap, ajv } = use(SchemaContext)!;
  const form = useFormContext();
  const keyName = `${fieldName}:${depth}`;
  const [info, setInfo] = useState<FieldInfo>(() => {
    const value = form.getValues(fieldName as "body");
    const initialInfo = fieldInfoMap.get(keyName);
    if (initialInfo) return initialInfo;

    const out: FieldInfo = {
      oneOf: -1,
    };
    const union = getUnion(schema);
    if (union) {
      const [members, field] = union;

      out.oneOf = members.findIndex((item) => ajv.validate(item, value));
      if (out.oneOf === -1) out.oneOf = 0;
      out.unionField = field;
    }

    if (Array.isArray(schema.type)) {
      const types = schema.type;

      out.selectedType =
        types.find((type) => {
          schema.type = type;
          const match = ajv.validate(schema, value);
          schema.type = types;

          return match;
        }) ?? types.at(0);
    }

    if (schema.allOf) {
      const merged = mergeAllOf(schema);

      if (typeof merged !== "boolean")
        out.intersection = {
          merged,
        };
    }

    return out;
  });

  fieldInfoMap.set(keyName, info);

  return {
    info,
    updateInfo(value) {
      const updated = {
        ...info,
        ...value,
      };

      if (updated.oneOf === info.oneOf && updated.selectedType === info.selectedType) return;

      setInfo(updated);

      let valueSchema: JSONSchema = schema;
      if (updated.unionField) {
        valueSchema = schema[updated.unionField]![updated.oneOf];
      } else if (updated.selectedType) {
        valueSchema = { ...schema, type: updated.selectedType };
      }

      form.setValue(fieldName, getDefaultValue(valueSchema));
    },
  };
}

/**
 * Resolve `$ref` in the schema, **not recursive**.
 */
export function useResolvedSchema(schema: JSONSchema): Exclude<JSONSchema, boolean> {
  const { ajv } = use(SchemaContext)!;

  return useMemo(() => fallbackAny(dereference(schema, { ajv })), [ajv, schema]);
}

export function fallbackAny(schema: JSONSchema): Exclude<JSONSchema, boolean> {
  return typeof schema === "boolean" ? anyFields : schema;
}

function getUnion(
  schema: Exclude<JSONSchema, boolean>,
): [readonly JSONSchema[], UnionField] | undefined {
  if (schema.anyOf) {
    return [schema.anyOf, "anyOf"];
  }

  if (schema.oneOf) return [schema.oneOf, "oneOf"];
}

/**
 * resolve refs (non-recursive)
 */
export function dereference(
  schema: JSONSchema,
  { ajv }: Pick<SchemaContextType, "ajv">,
): JSONSchema {
  if (typeof schema === "boolean") return schema;
  if (schema.$ref) return ajv.getSchema(schema.$ref)?.schema ?? false;
  return schema;
}
