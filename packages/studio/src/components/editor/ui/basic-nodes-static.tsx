"use client";
import type * as React from "react";

import type { SlateElementProps } from "@platejs/core/static";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { SlateElement } from "@platejs/core/static";

const headingVariants = cva("relative mb-1", {
  variants: {
    variant: {
      h1: "mt-[1.6em] pb-1 font-bold text-4xl",
      h2: "mt-[1.4em] pb-px font-semibold text-2xl tracking-tight",
      h3: "mt-[1em] pb-px font-semibold text-xl tracking-tight",
      h4: "mt-[0.75em] font-semibold text-lg tracking-tight",
      h5: "mt-[0.75em] font-semibold text-lg tracking-tight",
      h6: "mt-[0.75em] font-semibold text-base tracking-tight",
    },
  },
});

export function HeadingElementStatic({
  variant = "h1",
  ...props
}: SlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <SlateElement as={variant!} className={headingVariants({ variant })} {...props}>
      {props.children}
    </SlateElement>
  );
}

export function H1ElementStatic(props: SlateElementProps) {
  return <HeadingElementStatic variant="h1" {...props} />;
}

export function H2ElementStatic(props: React.ComponentProps<typeof HeadingElementStatic>) {
  return <HeadingElementStatic variant="h2" {...props} />;
}

export function H3ElementStatic(props: React.ComponentProps<typeof HeadingElementStatic>) {
  return <HeadingElementStatic variant="h3" {...props} />;
}

export function H4ElementStatic(props: React.ComponentProps<typeof HeadingElementStatic>) {
  return <HeadingElementStatic variant="h4" {...props} />;
}

export function H5ElementStatic(props: React.ComponentProps<typeof HeadingElementStatic>) {
  return <HeadingElementStatic variant="h5" {...props} />;
}

export function H6ElementStatic(props: React.ComponentProps<typeof HeadingElementStatic>) {
  return <HeadingElementStatic variant="h6" {...props} />;
}

export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="cursor-text py-6" contentEditable={false}>
        <hr className={cn("h-0.5 rounded-sm border-none bg-muted bg-clip-content")} />
      </div>
      {props.children}
    </SlateElement>
  );
}

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className={cn("m-0 px-0 py-1")}>
      {props.children}
    </SlateElement>
  );
}

export function BlockquoteElementStatic(props: SlateElementProps) {
  return <SlateElement as="blockquote" className="my-1 border-l-2 pl-6 italic" {...props} />;
}
