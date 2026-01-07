"use client";

import { Combobox } from "@base-ui/react";
import { useControlled } from "@base-ui/utils/useControlled";
import { useStableCallback } from "@base-ui/utils/useStableCallback";
import { useComboboxInput, useHTMLInputCursorState } from "@platejs/combobox/react";
import { cva } from "class-variance-authority";
import type { Point, TElement } from "platejs";
import { useComposedRef, useEditorRef } from "platejs/react";
import * as React from "react";
import { useIsCreator } from "@/hooks/editor/use-is-creator";
import { cn } from "@/lib/utils";

interface InlineComboboxContextValue {
  showTrigger: boolean;
  trigger: string;
  removeInput: (focus: boolean) => void;

  inputRef: React.RefObject<HTMLInputElement | null>;
  inputOnBlur: React.FocusEventHandler<HTMLElement>;
  inputOnKeyDown: React.KeyboardEventHandler<HTMLElement>;
}

const InlineComboboxContext = React.createContext<InlineComboboxContextValue>(
  null as unknown as InlineComboboxContextValue,
);

interface InlineComboboxProps extends React.ComponentProps<typeof Combobox.Root> {
  element: TElement;
  trigger: string;
  hideWhenNoValue?: boolean;
  showTrigger?: boolean;
}

function InlineCombobox({
  children,
  element,
  hideWhenNoValue = false,
  showTrigger = true,
  trigger,
  inputValue: inputValueProp,
  onInputValueChange: onInputValueChangeProp,
  defaultInputValue = "",
  ...rest
}: InlineComboboxProps) {
  const editor = useEditorRef();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cursorState = useHTMLInputCursorState(inputRef);
  const isCreator = useIsCreator(element);
  const [inputValue, setInputValueUnwrapped] = useControlled({
    name: "InlineCombobox",
    controlled: inputValueProp,
    default: defaultInputValue,
  });

  /**
   * Track the point just before the input element so we know where to
   * insertText if the combobox closes due to a selection change.
   */
  const insertPoint = React.useRef<Point | null>(null);

  React.useEffect(() => {
    const path = editor.api.findPath(element);
    if (!path) return;

    const point = editor.api.before(path);
    if (!point) return;

    const pointRef = editor.api.pointRef(point);
    insertPoint.current = pointRef.current;

    return () => {
      pointRef.unref();
    };
  }, [editor, element]);

  const { props: inputProps, removeInput } = useComboboxInput({
    cancelInputOnBlur: true,
    cursorState,
    autoFocus: isCreator,
    ref: inputRef,
    onCancelInput: (cause) => {
      if (cause !== "backspace") {
        editor.tf.insertText(trigger + inputValue, {
          at: insertPoint?.current ?? undefined,
        });
      }
      if (cause === "arrowLeft" || cause === "arrowRight") {
        editor.tf.move({
          distance: 1,
          reverse: cause === "arrowLeft",
        });
      }
    },
  });
  const onKeyDown = useStableCallback(inputProps.onKeyDown);
  const onBlur = useStableCallback(inputProps.onBlur);
  const contextValue: InlineComboboxContextValue = React.useMemo(
    () => ({
      showTrigger,
      trigger,
      inputProps,
      inputRef,
      removeInput,
      inputOnBlur: onBlur,
      inputOnKeyDown: onKeyDown,
    }),
    [trigger, showTrigger, onBlur, onKeyDown],
  );

  return (
    <span contentEditable={false}>
      <InlineComboboxContext.Provider value={contextValue}>
        <Combobox.Root
          open
          inputValue={inputValue}
          onInputValueChange={(v, e) => {
            setInputValueUnwrapped(v);
            return onInputValueChangeProp?.(v, e);
          }}
          {...rest}
        >
          {children}
        </Combobox.Root>
      </InlineComboboxContext.Provider>
    </span>
  );
}

function InlineComboboxInput({ ref, className, ...props }: React.ComponentProps<"input">) {
  const { showTrigger, trigger, inputOnBlur, inputOnKeyDown, inputRef } =
    React.useContext(InlineComboboxContext);

  return (
    <>
      {showTrigger && trigger}
      <Combobox.Input
        ref={useComposedRef(inputRef, ref)}
        className={cn("bg-transparent outline-none", className)}
        onBlur={inputOnBlur}
        onKeyDown={inputOnKeyDown}
        {...props}
      />
    </>
  );
}

function InlineComboboxContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner className="z-50">
        <Combobox.Popup
          className={cn(
            "max-h-[288px] w-[300px] overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-lg border",
            className,
          )}
          {...props}
        />
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}

const comboboxItemVariants = cva(
  "relative mx-1 flex h-[28px] select-none items-center rounded-sm px-2 text-foreground text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      interactive: {
        false: "",
        true: "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      },
    },
    defaultVariants: {
      interactive: true,
    },
  },
);

function InlineComboboxItem({
  className,
  focusEditor = true,
  onClick,
  ...props
}: React.ComponentProps<typeof Combobox.Item> & {
  focusEditor?: boolean;
}) {
  const { removeInput } = React.useContext(InlineComboboxContext);

  return (
    <Combobox.Item
      className={cn(comboboxItemVariants(), className)}
      onClick={(event) => {
        // Focus editor if needed
        removeInput(focusEditor);
        onClick?.(event);
      }}
      {...props}
    />
  );
}

function InlineComboboxEmpty({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Combobox.Empty>) {
  return (
    <Combobox.Empty
      className={cn("p-4 text-muted-foreground text-sm empty:hidden", className)}
      {...props}
    >
      {children}
    </Combobox.Empty>
  );
}

const InlineComboboxList = Combobox.List;
const InlineComboboxCollection = Combobox.Collection;

function InlineComboboxGroup({ className, ...props }: React.ComponentProps<typeof Combobox.Group>) {
  return (
    <Combobox.Group
      {...props}
      className={cn("hidden not-last:border-b py-1.5 [&:has([role=option])]:block", className)}
    />
  );
}

function InlineComboboxGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof Combobox.GroupLabel>) {
  return (
    <Combobox.GroupLabel
      {...props}
      className={cn("mt-1.5 mb-2 px-3 font-medium text-muted-foreground text-xs", className)}
    />
  );
}

export {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
  InlineComboboxList,
  InlineComboboxCollection,
};
