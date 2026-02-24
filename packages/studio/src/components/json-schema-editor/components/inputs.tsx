"use client";
import {
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
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
import { anyFields, useEditorContext, useFieldInfo, useResolvedSchema } from "../schema";
import { buttonVariants } from "@/components/ui/button";
import { stringifyFieldKey } from "@fumari/stf/lib/utils";
import { cva } from "class-variance-authority";
import type { JSONSchema } from "json-schema-typed";
import { labelVariants } from "@/components/ui/label";
import { useHocuspocusProvider } from "@/lib/yjs/provider";
import { awarenessSchema } from "@/lib/yjs";

const fieldLabelVariants = cva("w-full inline-flex items-center gap-0.5");

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
    <div {...props} className={cn("flex flex-col gap-4", props.className)}>
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
        <div className="flex gap-2">
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
  const [value, setValue] = useFieldValue(fieldName);
  const id = stringifyFieldKey(fieldName);
  if (field.type === "null") return;

  if (field.type === "string" && field.format === "binary") {
    return (
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
      </>
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

  const isNumber = field.type === "integer" || field.type === "number";
  return (
    <Input
      id={id}
      placeholder="Enter value"
      type={isNumber ? "number" : "text"}
      step={field.type === "integer" ? 1 : undefined}
      value={String(value ?? "")}
      onChange={(e) => {
        if (isNumber) {
          setValue(Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber);
        } else if (!isNumber) {
          setValue(e.target.value);
        }
      }}
    />
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
  const { yjs } = useEditorContext();
  const [isDefined] = useFieldValue(fieldName, {
    compute(currentValue) {
      return currentValue !== undefined;
    },
  });

  if (_field === false) return;
  if (collapsible && !isDefined && show) setShow(false);

  function container(props: ComponentProps<"fieldset">) {
    if (!yjs) return <fieldset {...props} />;

    return <CollaborationFieldSet fieldId={id} {...props} />;
  }

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

  function renderUnsetButton() {
    return (
      <button
        type="button"
        onClick={() => dataEngine.delete(fieldName)}
        className="text-muted-foreground hover:text-accent-foreground"
      >
        <X className="size-3.5" />
      </button>
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
        collapsible={collapsible}
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
        collapsible={collapsible}
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
    return container({
      ...props,
      className: cn("flex flex-col gap-1.5", props.className),
      children: (
        <>
          <div className={fieldLabelVariants()}>
            {renderLabelTrigger(schema)}
            {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
            {toolbar}
            {!isRequired && isDefined && renderUnsetButton()}
          </div>
          {show && (
            <ObjectInput
              field={schema}
              fieldName={fieldName}
              className="rounded-lg border bg-card text-card-foreground p-2 shadow-sm"
            />
          )}
        </>
      ),
    });
  }

  if (field.type === "array") {
    return container({
      ...props,
      className: cn("flex flex-col gap-1.5", props.className),
      children: (
        <>
          <div className={fieldLabelVariants()}>
            {renderLabelTrigger()}
            {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
            {toolbar}
            {!isRequired && isDefined && renderUnsetButton()}
          </div>
          {show && (
            <ArrayInput
              fieldName={fieldName}
              items={field.items ?? anyFields}
              className="rounded-lg border bg-card text-card-foreground p-2 shadow-sm"
            />
          )}
        </>
      ),
    });
  }

  return container({
    ...props,
    className: cn("flex flex-col gap-1.5", props.className),
    children: (
      <>
        <label className={fieldLabelVariants()} htmlFor={id}>
          {renderLabelName()}
          {slotType ?? <FieldLabelType>{schemaToString(field)}</FieldLabelType>}
          {toolbar}
          {!isRequired && isDefined && renderUnsetButton()}
        </label>
        <FieldInput field={field} fieldName={fieldName} isRequired={isRequired} />
      </>
    ),
  });
}

interface User {
  name: string;
  color: string;
}

function CollaborationFieldSet({
  fieldId: id,
  ...rest
}: ComponentProps<"fieldset"> & { fieldId: string }) {
  const { awareness } = useHocuspocusProvider();
  const [users, setUsers] = useState<User[]>([]);

  const onAwarenessChange = useEffectEvent(() => {
    const newUsers: User[] = [];

    for (const [clientId, rawItem] of awareness.getStates()) {
      if (clientId === awareness.clientID) continue;

      const result = awarenessSchema.safeParse(rawItem);
      if (!result.success) continue;
      const item = result.data;

      if (item["json-schema-editor"]?.focused === id && item.data) {
        newUsers.push(item.data);
      }
    }

    setUsers(newUsers);
  });

  useEffect(() => {
    awareness.on("change", onAwarenessChange);
    return () => {
      awareness.off("change", onAwarenessChange);
    };
  }, [awareness]);

  return (
    <fieldset
      {...rest}
      className={cn(
        "relative",
        rest.className,
        users.length > 0 && "[&_input]:ring-2! [&_input]:ring-orange-400!",
      )}
      onFocus={(event) => {
        awareness.setLocalStateField("json-schema-editor", {
          focused: id,
        });
        event.stopPropagation();
      }}
    >
      {users.length > 0 && (
        <div className="absolute bottom-0 translate-y-full z-10 start-1 flex gap-0.5">
          {users.map((user) => (
            <p
              key={user.name}
              className="px-2 py-1 text-xs bg-(--user-color,--color-primary) font-medium text-white shadow-md rounded-b-md"
              style={
                {
                  "--user-color": user.color,
                } as object
              }
            >
              {user.name}
            </p>
          ))}
        </div>
      )}

      {rest.children}
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
