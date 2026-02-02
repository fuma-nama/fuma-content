"use client";
import { type ComponentProps, type HTMLAttributes, type ReactNode, useState } from "react";
import { ChevronRight, Plus, Trash2, X } from "lucide-react";
import { FieldKey, useArray, useDataEngine, useFieldValue, useObject } from "@fumari/stf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getDefaultValue } from "../get-default-values";
import { cn } from "@/lib/utils";
import { FormatFlags, schemaToString } from "../utils/schema-to-string";
import { anyFields, useFieldInfo, useResolvedSchema } from "../schema";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import { stringifyFieldKey } from "@fumari/stf/lib/utils";
import { cva } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

const labelVariants = cva(
  "text-xs font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

function FieldLabel(props: ComponentProps<"label">) {
  return (
    <label {...props} className={cn("w-full inline-flex items-center gap-0.5", props.className)}>
      {props.children}
    </label>
  );
}

function FieldLabelType(props: ComponentProps<"code">) {
  return (
    <code {...props} className={cn("text-xs text-muted-foreground", props.className)}>
      {props.children}
    </code>
  );
}

export function ObjectInput({
  field: _field,
  fieldName,
  ...props
}: {
  field: Exclude<JSONSchema, boolean>;
  fieldName: FieldKey;
} & ComponentProps<"div">) {
  const field = useResolvedSchema(_field);
  const [nextName, setNextName] = useState("");
  const { properties, onAppend, onDelete } = useObject(fieldName, {
    defaultValue: () => getDefaultValue(field) as object,
    properties: field.properties ?? {},
    fallback: field.additionalProperties,
    patternProperties: field.patternProperties,
  });

  const isDynamic = field.patternProperties ?? field.additionalProperties;
  return (
    <div {...props} className={cn("grid grid-cols-1 gap-4 @md:grid-cols-2", props.className)}>
      {properties.map((child) => {
        let toolbar: ReactNode = null;
        if (child.kind === "pattern" || child.kind === "fallback") {
          toolbar = (
            <button
              type="button"
              aria-label="Remove Item"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "icon-xs",
                }),
              )}
              onClick={() => {
                onDelete(child.key);
              }}
            >
              <Trash2 />
            </button>
          );
        }

        return (
          <FieldSet
            key={child.key}
            name={child.key}
            field={child.info}
            fieldName={child.field}
            isRequired={field.required?.includes(child.key)}
            toolbar={toolbar}
          />
        );
      })}
      {isDynamic && (
        <div className="flex gap-2 col-span-full">
          <Input
            value={nextName}
            placeholder="Enter Property Name"
            onChange={(e) => setNextName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setNextName("");
                onAppend(nextName);
                e.preventDefault();
              }
            }}
          />
          <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "px-4")}
            onClick={() => {
              onAppend(nextName);
              setNextName("");
            }}
          >
            New
          </button>
        </div>
      )}
    </div>
  );
}

export function JsonInput({ fieldName }: { fieldName: FieldKey }) {
  const engine = useDataEngine();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(() => JSON.stringify(engine.init(fieldName, {}), null, 2));

  return (
    <div className="flex flex-col bg-secondary text-secondary-foreground overflow-hidden border rounded-lg">
      <textarea
        value={value}
        className="p-2 h-[240px] text-sm font-mono resize-none focus-visible:outline-none"
        onChange={(v) => {
          setValue(v.target.value);
          try {
            engine.update(fieldName, JSON.parse(v.target.value));
            setError(null);
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          }
        }}
      />
      <p className="p-2 text-xs font-mono border-t text-red-400 empty:hidden">{error}</p>
    </div>
  );
}

export function FieldInput({
  field,
  fieldName,
  isRequired,
  ...props
}: HTMLAttributes<HTMLElement> & {
  field: Exclude<JSONSchema, boolean>;
  isRequired?: boolean;
  fieldName: FieldKey;
}) {
  const engine = useDataEngine();
  const [value, setValue] = useFieldValue(fieldName);
  const id = stringifyFieldKey(fieldName);
  if (field.type === "null") return;

  function renderUnset(children: ReactNode) {
    return (
      <div {...props} className={cn("flex flex-row gap-2", props.className)}>
        {children}
        {value !== undefined && !isRequired && (
          <button
            type="button"
            onClick={() => engine.delete(fieldName)}
            className="text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  if (field.enum && field.enum.length > 0) {
    const idx = field.enum.indexOf(value);

    return (
      <Select value={String(idx)} onValueChange={(v) => setValue(field.enum![Number(v)])}>
        <SelectTrigger id={id} {...props}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.enum.map((item, i) => (
            <SelectItem key={i} value={String(i)}>
              {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
            </SelectItem>
          ))}
          {!isRequired && <SelectItem value="-1">Unset</SelectItem>}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "boolean") {
    return (
      <Select
        value={String(value)}
        onValueChange={(value) => setValue(value === "undefined" ? undefined : value === "true")}
      >
        <SelectTrigger id={id} {...props}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
          {!isRequired && <SelectItem value="undefined">Unset</SelectItem>}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "integer" || field.type === "number") {
    return renderUnset(
      <Input
        id={id}
        placeholder="Enter value"
        type="number"
        step={field.type === "integer" ? 1 : undefined}
        value={String(value ?? "")}
        onChange={(e) =>
          setValue(Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)
        }
      />,
    );
  }

  if (field.type === "string" && field.format === "binary") {
    return renderUnset(
      <>
        <label
          htmlFor={id}
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "w-full h-9 gap-2 truncate",
            }),
          )}
        >
          {value instanceof File ? (
            <>
              <span className="text-muted-foreground text-xs">Selected</span>
              <span className="truncate w-0 flex-1 text-end">{value.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Upload</span>
          )}
        </label>
        <input
          id={id}
          type="file"
          multiple={false}
          onChange={(e) => {
            if (!e.target.files || e.target.files.length === 0) return;
            setValue(e.target.files.item(0));
          }}
          hidden
        />
      </>,
    );
  }

  return renderUnset(
    <Input
      id={id}
      placeholder="Enter value"
      type={field.format === "date" ? "date" : "text"}
      value={String(value ?? "")}
      onChange={(e) => setValue(e.target.value)}
    />,
  );
}

export function FieldSet({
  field: _field,
  fieldName,
  toolbar,
  name,
  isRequired,
  depth = 0,
  slotType,
  collapsible = true,
  ...props
}: HTMLAttributes<HTMLElement> & {
  isRequired?: boolean;
  name?: ReactNode;
  field: JSONSchema;
  fieldName: FieldKey;
  depth?: number;

  slotType?: ReactNode;
  toolbar?: ReactNode;
  collapsible?: boolean;
}) {
  const field = useResolvedSchema(_field);
  const [show, setShow] = useState(!collapsible);
  const { info, updateInfo } = useFieldInfo(fieldName, field);
  const id = stringifyFieldKey(fieldName);
  const dataEngine = useDataEngine();

  if (_field === false) return;

  function renderLabelTrigger(schema = field) {
    if (!collapsible) return renderLabelName();

    return (
      <button
        type="button"
        className={cn(labelVariants(), "inline-flex items-center gap-1 font-mono me-auto")}
        onClick={() => {
          dataEngine.init(fieldName, getDefaultValue(schema));
          setShow((prev) => !prev);
        }}
      >
        <ChevronRight className={cn("size-3.5 text-muted-foreground", show && "rotate-90")} />
        {name}
        {isRequired && <span className="text-red-400/80">*</span>}
      </button>
    );
  }

  function renderLabelName() {
    return (
      <span className={cn(labelVariants(), "font-mono me-auto")}>
        {name}
        {isRequired && <span className="text-red-400/80 mx-1">*</span>}
      </span>
    );
  }

  if (info.unionField && field[info.unionField]) {
    const union = field[info.unionField]!;
    const showSelect = union.length > 1;

    return (
      <FieldSet
        {...props}
        name={name}
        fieldName={fieldName}
        isRequired={isRequired}
        field={union[info.oneOf]}
        depth={depth + 1}
        slotType={showSelect ? false : slotType}
        toolbar={
          <>
            {showSelect && (
              <select
                className="text-xs font-mono"
                value={info.oneOf}
                onChange={(e) => {
                  updateInfo({
                    oneOf: Number(e.target.value),
                  });
                }}
              >
                {union.map((item, i) => (
                  <option key={i} value={i} className="bg-popover text-popover-foreground">
                    {schemaToString(item, FormatFlags.UseAlias)}
                  </option>
                ))}
              </select>
            )}
            {toolbar}
          </>
        }
      />
    );
  }

  if (Array.isArray(field.type)) {
    const showSelect = field.type.length > 1;

    return (
      <FieldSet
        {...props}
        name={name}
        fieldName={fieldName}
        isRequired={isRequired}
        field={{
          ...field,
          type: info.selectedType,
        }}
        depth={depth + 1}
        slotType={showSelect ? false : slotType}
        toolbar={
          <>
            {showSelect && (
              <select
                className="text-xs font-mono"
                value={info.selectedType}
                onChange={(e) => {
                  updateInfo({
                    selectedType: e.target.value,
                  });
                }}
              >
                {field.type.map((item) => (
                  <option key={item} value={item} className="bg-popover text-popover-foreground">
                    {item}
                  </option>
                ))}
              </select>
            )}
            {toolbar}
          </>
        }
      />
    );
  }

  if (field.type === "object" || info.intersection) {
    const schema = info.intersection?.merged ?? field;
    return (
      <fieldset
        {...props}
        className={cn("flex flex-col gap-1.5 col-span-full @container", props.className)}
      >
        <FieldLabel htmlFor={id}>
          {renderLabelTrigger(schema)}
          {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
          {toolbar}
        </FieldLabel>
        {show && (
          <ObjectInput
            field={schema}
            fieldName={fieldName}
            className="rounded-lg border border-primary/20 bg-background/50 p-2 shadow-sm"
          />
        )}
      </fieldset>
    );
  }

  if (field.type === "array") {
    return (
      <fieldset {...props} className={cn("flex flex-col gap-1.5 col-span-full", props.className)}>
        <FieldLabel htmlFor={id}>
          {renderLabelTrigger()}
          {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
          {toolbar}
        </FieldLabel>
        {show && (
          <ArrayInput
            fieldName={fieldName}
            items={field.items ?? anyFields}
            className="rounded-lg border border-primary/20 bg-background/50 p-2 shadow-sm"
          />
        )}
      </fieldset>
    );
  }
  return (
    <fieldset {...props} className={cn("flex flex-col gap-1.5", props.className)}>
      <FieldLabel htmlFor={id}>
        {renderLabelName()}
        {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
        {toolbar}
      </FieldLabel>
      <FieldInput field={field} fieldName={fieldName} isRequired={isRequired} />
    </fieldset>
  );
}

function ArrayInput({
  fieldName,
  items: itemSchema,
  ...props
}: {
  fieldName: FieldKey;
  items: JSONSchema;
} & ComponentProps<"div">) {
  const name = fieldName.at(-1) ?? "";
  const { items, insertItem, removeItem } = useArray(fieldName, {
    defaultValue: [],
  });

  return (
    <div {...props} className={cn("flex flex-col gap-2", props.className)}>
      {items.map((item) => (
        <FieldSet
          key={item.index}
          name={
            <span className="text-muted-foreground">
              {name}[{item.index}]
            </span>
          }
          field={itemSchema}
          isRequired
          fieldName={item.field}
          toolbar={
            <button
              type="button"
              aria-label="Remove Item"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "icon-xs",
                }),
              )}
              onClick={() => removeItem(item.index)}
            >
              <Trash2 />
            </button>
          }
        />
      ))}
      <button
        type="button"
        className={cn(
          buttonVariants({
            variant: "secondary",
            className: "gap-1.5 py-2",
            size: "sm",
          }),
        )}
        onClick={() => {
          insertItem(getDefaultValue(itemSchema));
        }}
      >
        <Plus className="size-4" />
        New Item
      </button>
    </div>
  );
}
