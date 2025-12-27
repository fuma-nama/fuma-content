"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import { filterWords } from "@platejs/combobox";
import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  SparklesIcon,
  Square,
  Table,
  TableOfContentsIcon,
} from "lucide-react";
import { KEYS, type TComboboxInputElement } from "platejs";
import type { PlateEditor, PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";
import type * as React from "react";
import { insertBlock, insertInlineElement } from "@/components/editor/transforms";
import {
  InlineCombobox,
  InlineComboboxCollection,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
  InlineComboboxList,
} from "./inline-combobox";

interface Group {
  group: string;
  items: GroupItem[];
}

interface GroupItem {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  focusEditor?: boolean;
  keywords?: string[];
  label?: string;
}

const groups: Group[] = [
  {
    group: "AI",
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: "AI",
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: "Basic blocks",
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ["paragraph"],
        label: "Text",
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ["title", "h1"],
        label: "Heading 1",
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ["subtitle", "h2"],
        label: "Heading 2",
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ["subtitle", "h3"],
        label: "Heading 3",
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ["unordered", "ul", "-"],
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ["ordered", "ol", "1"],
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ["checklist", "task", "checkbox", "[]"],
        label: "To-do list",
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ["collapsible", "expandable"],
        label: "Toggle",
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ["```"],
        label: "Code Block",
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        label: "Table",
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ["citation", "blockquote", "quote", ">"],
        label: "Blockquote",
        value: KEYS.blockquote,
      },
      {
        description: "Insert a highlighted block.",
        icon: <LightbulbIcon />,
        keywords: ["note"],
        label: "Callout",
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: "Advanced blocks",
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ["toc"],
        label: "Table of contents",
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: "3 columns",
        value: "action_three_columns",
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Equation",
        value: KEYS.equation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: "Inline",
    items: [
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ["time"],
        label: "Date",
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Inline Equation",
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        element={element}
        trigger="/"
        items={groups}
        filter={(itemValue, search) => {
          const item = itemValue as GroupItem;

          return [item.value, ...(item.keywords ?? []), item.label].some(
            (keyword) => keyword && filterWords(keyword, search),
          );
        }}
      >
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxList>
            {(group: Group) => (
              <InlineComboboxGroup key={group.group} items={group.items}>
                <InlineComboboxGroupLabel>{group.group}</InlineComboboxGroupLabel>

                <InlineComboboxCollection>
                  {(item: GroupItem) => (
                    <InlineComboboxItem
                      key={item.value}
                      value={item}
                      onClick={() => item.onSelect(editor, item.value)}
                      focusEditor={item.focusEditor}
                    >
                      <div className="mr-2 text-muted-foreground">{item.icon}</div>
                      {item.label ?? item.value}
                    </InlineComboboxItem>
                  )}
                </InlineComboboxCollection>
              </InlineComboboxGroup>
            )}
          </InlineComboboxList>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
