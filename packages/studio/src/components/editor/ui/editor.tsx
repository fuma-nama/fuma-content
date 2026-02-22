"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { PlateContentProps, PlateViewProps } from "platejs/react";
import { PlateContainer, PlateContent, PlateView } from "platejs/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const editorContainerVariants = cva(
  "relative w-full flex flex-col cursor-text select-text caret-primary selection:bg-brand/25 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15",
  {
    defaultVariants: {
      variant: "card",
    },
    variants: {
      variant: {
        comment: cn(
          "flex flex-row flex-wrap justify-between gap-1 px-1 py-0.5 overflow-y-auto rounded-md border-[1.5px] border-transparent bg-transparent",
          "has-[[data-slate-editor]:focus]:border-brand/50 has-[[data-slate-editor]:focus]:ring-2 has-[[data-slate-editor]:focus]:ring-brand/30",
          "has-aria-disabled:border-input has-aria-disabled:bg-muted",
        ),
        card: "border bg-card/50 text-card-foreground/90 rounded-xl [&_[data-heading-node]]:text-card-foreground",
        select: cn(
          "group overflow-y-auto rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "has-data-readonly:w-fit has-data-readonly:cursor-default has-data-readonly:border-transparent has-data-readonly:focus-within:[box-shadow:none]",
        ),
      },
    },
  },
);

export function EditorContainer({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof editorContainerVariants>) {
  return (
    <PlateContainer
      className={cn(
        "ignore-click-outside/toolbar",
        editorContainerVariants({ variant }),
        className,
      )}
      {...props}
    />
  );
}

const editorVariants = cva(
  cn(
    "group/editor relative flex-1 cursor-text select-text overflow-x-hidden whitespace-pre-wrap break-words",
    "focus-visible:outline-none",
    "**:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2 placeholder:text-muted-foreground/80 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!",
    "[&_strong]:font-semibold",
  ),
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      disabled: {
        true: "cursor-not-allowed opacity-50",
      },
      focused: {
        true: "ring-2 ring-ring ring-offset-2",
      },
      variant: {
        ai: "w-full px-0 text-base md:text-sm",
        aiChat:
          "max-h-[min(70vh,320px)] w-full max-w-[700px] overflow-y-auto px-3 py-2 text-base md:text-sm",
        comment: "rounded-none border-none bg-transparent text-sm",
        default: "size-full px-6 py-4 text-[15px]",
        fullWidth: "size-full px-16 pt-4 pb-72 text-base sm:px-24",
        none: "",
        select: "px-3 py-2 text-base data-readonly:w-fit",
      },
    },
  },
);

export type EditorProps = PlateContentProps & VariantProps<typeof editorVariants>;

export function Editor({
  className,
  disabled,
  focused,
  variant,
  ref,
  ...props
}: EditorProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <PlateContent
      ref={ref}
      className={cn(
        editorVariants({
          disabled,
          focused,
          variant,
        }),
        className,
      )}
      disabled={disabled}
      disableDefaultStyles
      {...props}
    />
  );
}

export function EditorView({
  className,
  variant,
  ...props
}: PlateViewProps & VariantProps<typeof editorVariants>) {
  return <PlateView {...props} className={cn(editorVariants({ variant }), className)} />;
}
