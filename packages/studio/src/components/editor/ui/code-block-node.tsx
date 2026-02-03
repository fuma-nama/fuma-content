"use client";

import * as React from "react";

import { formatCodeBlock, isLangSupported } from "@platejs/code-block";
import { BracesIcon, CheckIcon, CopyIcon } from "lucide-react";
import { type TCodeBlockElement, type TCodeSyntaxLeaf, NodeApi } from "platejs";
import {
  type PlateElementProps,
  type PlateLeafProps,
  PlateElement,
  PlateLeaf,
} from "platejs/react";
import { useEditorRef, useElement, useReadOnly } from "platejs/react";
import { Button } from "@/components/ui/button";
import { lowlight } from "@/lib/lowlight";
import highlight from "highlight.js";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export function CodeBlockElement(props: PlateElementProps<TCodeBlockElement>) {
  const { editor, element } = props;

  return (
    <PlateElement
      className="bg-secondary text-secondary-foreground border p-1 rounded-lg my-1 has-data-popup-open:ring-2 has-data-popup-open:ring-ring"
      {...props}
    >
      <div
        className="flex items-center select-none pb-1 contain-layout gap-1"
        contentEditable={false}
      >
        <CodeBlockCombobox />
        <CodeBlockMeta />
        {isLangSupported(element.lang) && (
          <Button
            size="xs"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => formatCodeBlock(editor, { element })}
          >
            <BracesIcon />
            Format
          </Button>
        )}

        <CopyButton
          size="icon-xs"
          variant="ghost"
          className="gap-1 text-muted-foreground"
          value={() => NodeApi.string(element)}
        />
      </div>

      <pre
        className="hljs rounded-lg border overflow-auto p-3 font-mono text-sm leading-normal [tab-size:2] shadow-sm print:break-inside-avoid"
        spellCheck={false}
      >
        <code>{props.children}</code>
      </pre>
    </PlateElement>
  );
}

interface Item {
  label: string;
  value: string;
}

function CodeBlockMeta() {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const element = useElement<TCodeBlockElement>();
  const [value, setValue] = React.useState(element.meta as string);

  if (readOnly)
    return <p className="px-2 flex-1 font-mono text-sm text-muted-foreground">{value}</p>;

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        editor.transforms.setNodes({ meta: value }, { at: element });
      }}
      placeholder="custom meta"
      className="px-2 rounded-lg flex-1 min-w-0 w-fit font-mono text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none not-focus-visible:text-muted-foreground placeholder:text-muted-foreground"
    />
  );
}

interface LanguageItem {
  label: string;
  value: string;
}

const languageItems = lowlight.listLanguages().map<LanguageItem>((lang) => {
  const info = highlight.getLanguage(lang)!;

  return {
    label: info.name ?? lang,
    value: lang,
  };
});

function CodeBlockCombobox() {
  const editor = useEditorRef();
  const element = useElement<TCodeBlockElement>();
  const readOnly = useReadOnly();
  const [open, setOpen] = React.useState(false);
  // needed to support setting a custom language
  const selectOnCloseRef = React.useRef<string | null>(null);
  const [items, value] = React.useMemo(() => {
    let items = languageItems;
    let value: LanguageItem | null = null;
    if (element.lang) {
      const info = highlight.getLanguage(element.lang);
      if (info) {
        value = languageItems.find((item) => item.label === info.name) ?? null;
      } else {
        value = {
          label: element.lang,
          value: element.lang,
        };
        items = [...items, value];
      }
    }

    return [items, value];
  }, [element.lang]);

  function setLang(lang: string) {
    editor.tf.setNodes<TCodeBlockElement>({ lang }, { at: element });
    // force re-highlight
    editor.tf.replaceNodes(element.children, { at: element, children: true });
  }

  if (readOnly) {
    return <p className="px-2 font-mono text-sm text-muted-foreground">{value?.label}</p>;
  }

  return (
    <Combobox
      items={items}
      value={value}
      onInputValueChange={(v) => {
        selectOnCloseRef.current = v;
      }}
      onValueChange={(item) => {
        if (item === null) return;
        setLang(item.value);
        selectOnCloseRef.current = null;
      }}
      open={open}
      onOpenChange={(v) => {
        if (!v && selectOnCloseRef.current) setLang(selectOnCloseRef.current);
        setOpen(v);
      }}
    >
      <ComboboxChipsInput
        placeholder="Select Language"
        className="px-2 rounded-lg font-mono text-sm not-data-popup-open:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      />
      <ComboboxContent className="max-w-[200px]">
        <ComboboxList>
          {(item: Item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function CopyButton({
  value,
  ...props
}: { value: (() => string) | string } & Omit<React.ComponentProps<typeof Button>, "value">) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const timerRef = React.useRef(0);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(typeof value === "function" ? value() : value);
        setHasCopied(true);

        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          setHasCopied(false);
        }, 2000);
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps<TCodeSyntaxLeaf>) {
  const tokenClassName = props.leaf.className as string;

  return <PlateLeaf className={tokenClassName} {...props} />;
}
