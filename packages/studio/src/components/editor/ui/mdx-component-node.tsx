import { MdxComponentElement, UnknownNode } from "../types";
import { PlateElement, PlateElementProps, useSelected } from "platejs/react";
import {
  JSONSchemaEditorContent,
  JSONSchemaEditorProvider,
} from "@/components/json-schema-editor/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRef, useState } from "react";

export function MdxComponent(props: PlateElementProps<MdxComponentElement>) {
  const { editor, element } = props;
  const [isEdit, setEdit] = useState(false);
  const valueRef = useRef<unknown>(null);

  return (
    <PlateElement
      as="div"
      {...props}
      attributes={{
        ...props.attributes,
        className: cn(
          "border rounded-md my-1 p-1.5 shadow-sm",
          isEdit && "border-primary",
          props.attributes.className,
        ),
      }}
    >
      <div
        contentEditable={false}
        className="flex items-center -mt-1.5 -mx-1.5 p-1.5 gap-2 bg-background rounded-t-[inherit]"
      >
        <p className="text-xs">
          <code>{element.element}</code> (MDX Component)
        </p>
        <Popover open={isEdit} onOpenChange={setEdit}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="xs">
              Edit Props
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-2"
            onCloseAutoFocus={() => {
              const v = valueRef.current;
              if (!v) return;
              editor.tf.setNodes<MdxComponentElement>(
                { customProps: typeof v === "object" ? { ...v } : v },
                { at: element },
              );
            }}
          >
            <JSONSchemaEditorProvider
              defaultValue={element.customProps}
              writeOnly
              readOnly={false}
              schema={{ type: "object", additionalProperties: true }}
              onValueChange={(v) => {
                valueRef.current = v;
              }}
            >
              <JSONSchemaEditorContent />
            </JSONSchemaEditorProvider>
          </PopoverContent>
        </Popover>
      </div>
      {props.children}
    </PlateElement>
  );
}

export function UnknownNodeComponent(props: PlateElementProps<UnknownNode>) {
  const element = props.element;
  const selected = useSelected();

  return (
    <PlateElement {...props}>
      <div
        contentEditable={false}
        className={cn("text-xs border my-1 rounded-md", selected && "border-primary")}
      >
        <p className="mb-1 bg-background p-1.5 rounded-t-[inherit]">
          <code>{element.raw.type}</code> (Unknown)
        </p>
        {element.md && (
          <pre className="overflow-auto text-muted-foreground p-1.5 rounded-b-[inherit]">
            <code>{element.md}</code>
          </pre>
        )}
      </div>
    </PlateElement>
  );
}
