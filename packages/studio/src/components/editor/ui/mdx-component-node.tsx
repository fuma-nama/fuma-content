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
import { Badge } from "@/components/ui/badge";

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
          "border rounded-md my-1 shadow-sm",
          isEdit && "border-primary",
          props.attributes.className,
        ),
      }}
    >
      <div
        contentEditable={false}
        className="flex items-center px-3 py-1 gap-2 bg-background rounded-t-[inherit]"
      >
        <code className="text-sm text-muted-foreground">{element.element}</code>
        <Badge variant="outline" className="font-mono">
          MDX Component
        </Badge>
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
      <div className="px-3 py-1.5">{props.children}</div>
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
        className={cn("text-sm border my-1 rounded-md", selected && "border-primary")}
      >
        <div className="flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-t-[inherit]">
          <code>{element.raw.type}</code>
          <Badge variant="outline" className="font-mono">
            Unknown
          </Badge>
        </div>
        {element.md && (
          <pre className="overflow-auto px-3 py-1.5 rounded-b-[inherit]">
            <code>{element.md}</code>
          </pre>
        )}
      </div>
    </PlateElement>
  );
}
