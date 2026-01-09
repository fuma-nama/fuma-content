"use client";
import { type ComponentProps, type HTMLAttributes, type ReactNode, useState } from "react";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useController, useFieldArray, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { labelVariants } from "@/components/ui/label";
import { getDefaultValue } from "../get-default-values";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FormatFlags, schemaToString } from "../utils/schema-to-string";
import { anyFields, useFieldInfo, useResolvedSchema, useSchema } from "../schema";
import type { JSONSchema } from "json-schema-typed/draft-2020-12";
import { Textarea } from "@/components/ui/textarea";

function FieldLabel(props: ComponentProps<"label">) {
  return (
    <label {...props} className={cn("w-full inline-flex items-center gap-0.5", props.className)}>
      {props.children}
    </label>
  );
}

function FieldLabelName({
  required = false,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { required?: boolean }) {
  return (
    <span {...props} className={cn(labelVariants(), "me-auto", className)}>
      {children}
      {required && <span className="text-destructive mx-1">*</span>}
    </span>
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
  fieldName: string;
} & ComponentProps<"div">) {
  const field = useResolvedSchema(_field);

  return (
    <div {...props} className={cn("flex flex-col gap-4", props.className)}>
      {Object.entries(field.properties ?? {}).map(([key, child]) => (
        <FieldSet
          key={key}
          name={key}
          field={child}
          fieldName={`${fieldName}.${key}`}
          isRequired={field.required?.includes(key)}
        />
      ))}
      {(field.additionalProperties || field.patternProperties) && (
        <DynamicProperties
          fieldName={fieldName}
          filterKey={(v) => !field.properties || !Object.keys(field.properties).includes(v)}
          getType={(key) => {
            for (const pattern in field.patternProperties) {
              if (key.match(RegExp(pattern))) {
                return field.patternProperties[pattern];
              }
            }

            if (field.additionalProperties) return field.additionalProperties;

            return anyFields;
          }}
        />
      )}
    </div>
  );
}

function DynamicProperties({
  fieldName,
  filterKey = () => true,
  getType = () => anyFields,
}: {
  fieldName: string;
  filterKey?: (key: string) => boolean;
  getType: (key: string) => JSONSchema;
}) {
  const { control, setValue, getValues } = useFormContext();
  const [nextName, setNextName] = useState("");
  const [properties, setProperties] = useState<string[]>(() => {
    const value = getValues(fieldName);
    if (value) return Object.keys(value).filter(filterKey);

    return [];
  });

  const onAppend = () => {
    const name = nextName.trim();
    if (name.length === 0) return;

    setProperties((p) => {
      if (p.includes(name) || !filterKey(name)) return p;
      const type = getType(name);

      setValue(`${fieldName}.${name}`, getDefaultValue(type));
      setNextName("");
      return [...p, name];
    });
  };

  return (
    <>
      {properties.map((item) => {
        const type = getType(item);

        return (
          <FieldSet
            key={item}
            name={item}
            field={type}
            fieldName={`${fieldName}.${item}`}
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
                onClick={() => {
                  setProperties((p) => p.filter((prop) => prop !== item));
                  control.unregister(`${fieldName}.${item}`);
                }}
              >
                <Trash2 />
              </button>
            }
          />
        );
      })}
      <div className="flex gap-2 col-span-full">
        <Input
          value={nextName}
          placeholder="Enter Property Name"
          onChange={(e) => setNextName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAppend();
              e.preventDefault();
            }
          }}
        />
        <button
          type="button"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "px-4")}
          onClick={onAppend}
        >
          New
        </button>
      </div>
    </>
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
  fieldName: string;
}) {
  const form = useFormContext();
  const {
    field: { value, onChange, ...restField },
    fieldState,
  } = useController({
    control: form.control,
    name: fieldName,
  });

  if (field.type === "null") return;

  if (field.enum) {
    return (
      <Select
        value={field.enum.indexOf(value).toString()}
        onValueChange={(value) => {
          onChange(value === "-1" ? undefined : value);
        }}
        disabled={restField.disabled}
      >
        <SelectTrigger id={fieldName} className={props.className} {...restField}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.enum.map((item, i) => (
            <SelectItem key={i} value={i.toString()}>
              {JSON.stringify(item)}
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
        onValueChange={(value) => onChange(value === "undefined" ? undefined : value === "true")}
        disabled={restField.disabled}
      >
        <SelectTrigger id={fieldName} className={props.className} {...restField}>
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

  const resetBn = fieldState.isDirty && (
    <button
      type="button"
      // TODO: `react-hook-form` doesn't support setting a value to `undefined` (aka remove the value), if there's a default value defined.
      // the default value is kept by `react-hook-form` internally, we cannot manipulate it.
      // hence, we can only support resetting to the default value.
      // perhaps when we migrate to Tanstack Form, we can reconsider this.
      onClick={() => form.resetField(fieldName)}
      className="text-muted-foreground"
    >
      <X className="size-4" />
    </button>
  );

  if (field.type === "string") {
    if (field.format === "binary") {
      return (
        <div {...props}>
          <label
            htmlFor={fieldName}
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
            id={fieldName}
            type="file"
            multiple={false}
            onChange={(e) => {
              if (!e.target.files) return;
              onChange(e.target.files.item(0));
            }}
            hidden
            {...restField}
          />
        </div>
      );
    }
    if (field.format === "datetime" || field.format === "time" || field.format === "date")
      return (
        <div {...props} className={cn("flex flex-row gap-2", props.className)}>
          <Input
            id={fieldName}
            type={field.format}
            placeholder="Enter value"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            {...restField}
          />
          {resetBn}
        </div>
      );

    return (
      <div {...props} className={cn("flex flex-row gap-2", props.className)}>
        <Textarea
          id={fieldName}
          placeholder="Enter value"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...restField}
        />
        {resetBn}
      </div>
    );
  }

  if (field.type === "integer" || field.type === "number") {
    return (
      <div {...props} className={cn("flex flex-row gap-2", props.className)}>
        <Input
          id={fieldName}
          placeholder="Enter value"
          type="number"
          step={field.type === "integer" ? 1 : undefined}
          value={value ?? ""}
          onChange={(e) => {
            if (!Number.isNaN(e.target.valueAsNumber)) {
              onChange(e.target.valueAsNumber);
            }
          }}
          {...restField}
        />
        {resetBn}
      </div>
    );
  }
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
  fieldName: string;
  depth?: number;

  slotType?: ReactNode;
  toolbar?: ReactNode;
  collapsible?: boolean;
}) {
  const schemaContext = useSchema();
  const field = useResolvedSchema(_field);
  const [show, setShow] = useState(!collapsible);
  const { info, updateInfo } = useFieldInfo(fieldName, field, depth);

  if (_field === false) return;
  if (field.readOnly && !schemaContext.readOnly) return;
  if (field.writeOnly && !schemaContext.writeOnly) return;

  if (info.unionField) {
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
                    {schemaToString(item, schemaContext, FormatFlags.UseAlias)}
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

  const showBn = collapsible && (
    <button
      type="button"
      onClick={() => setShow((prev) => !prev)}
      className={cn(
        buttonVariants({
          size: "icon-xs",
          variant: "ghost",
          className: "text-muted-foreground -ms-1",
        }),
      )}
    >
      <ChevronDown className={cn(show && "rotate-180")} />
    </button>
  );

  if (field.type === "object" || info.intersection) {
    return (
      <fieldset
        {...props}
        className={cn("flex flex-col gap-1.5 col-span-full @container", props.className)}
      >
        <FieldLabel htmlFor={fieldName}>
          {showBn}
          <FieldLabelName required={isRequired}>{name}</FieldLabelName>
          {slotType ?? <FieldLabelType>{schemaToString(field, schemaContext)}</FieldLabelType>}
          {toolbar}
        </FieldLabel>
        {show && (
          <ObjectInput
            field={info.intersection?.merged ?? field}
            fieldName={fieldName}
            {...props}
            className={cn(
              "rounded-lg border bg-card text-card-foreground p-3 shadow-sm",
              props.className,
            )}
          />
        )}
      </fieldset>
    );
  }

  if (field.type === "array") {
    return (
      <fieldset {...props} className={cn("flex flex-col gap-1.5 col-span-full", props.className)}>
        <FieldLabel htmlFor={fieldName}>
          {showBn}
          <FieldLabelName required={isRequired}>{name}</FieldLabelName>
          {slotType ?? <FieldLabelType>{schemaToString(field, schemaContext)}</FieldLabelType>}
          {toolbar}
        </FieldLabel>
        {show && (
          <ArrayInput
            fieldName={fieldName}
            items={field.items ?? anyFields}
            {...props}
            className={cn(
              "rounded-lg border bg-card text-card-foreground p-3 shadow-sm",
              props.className,
            )}
          />
        )}
      </fieldset>
    );
  }

  if (!field.type) {
    return (
      <FieldSet
        {...props}
        name={name}
        fieldName={fieldName}
        isRequired={isRequired}
        field={anyFields}
        depth={depth + 1}
        slotType={slotType}
        toolbar={toolbar}
      />
    );
  }

  return (
    <fieldset {...props} className={cn("flex flex-col gap-1.5", props.className)}>
      <FieldLabel htmlFor={fieldName}>
        <FieldLabelName required={isRequired}>{name}</FieldLabelName>
        {slotType ?? <FieldLabelType>{schemaToString(field, schemaContext)}</FieldLabelType>}
        {toolbar}
      </FieldLabel>
      <FieldInput field={field} fieldName={fieldName} isRequired={isRequired} />
    </fieldset>
  );
}

function ArrayInput({
  fieldName,
  items,
  ...props
}: {
  fieldName: string;
  items: JSONSchema;
} & ComponentProps<"div">) {
  const name = fieldName.split(".").at(-1) ?? "";
  const { fields, append, remove } = useFieldArray({
    name: fieldName,
  });

  return (
    <div {...props} className={cn("flex flex-col gap-2", props.className)}>
      {fields.map((item, index) => (
        <FieldSet
          key={item.id}
          name={
            <span className="text-muted-foreground">
              {name}[{index}]
            </span>
          }
          field={items}
          isRequired
          fieldName={`${fieldName}.${index}`}
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
              onClick={() => remove(index)}
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
          append(getDefaultValue(items));
        }}
      >
        <Plus className="size-4" />
        New Item
      </button>
    </div>
  );
}
