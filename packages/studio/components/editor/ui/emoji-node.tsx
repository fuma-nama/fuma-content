"use client";

import { type Emoji, EmojiInlineIndexSearch, insertEmoji } from "@platejs/emoji";
import { EmojiPlugin } from "@platejs/emoji/react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, usePluginOption } from "platejs/react";
import * as React from "react";

import { useDebounce } from "@/hooks/use-debounce";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxInput,
  InlineComboboxItem,
  InlineComboboxList,
} from "./inline-combobox";

const TRAILING_COLON_REGEX = /:$/;

export function EmojiInputElement(props: PlateElementProps) {
  const { children, editor, element } = props;
  const data = usePluginOption(EmojiPlugin, "data")!;
  const [value, setValue] = React.useState("");
  const debouncedValue = useDebounce(value, 100);
  const isPending = value !== debouncedValue;

  const filteredEmojis: Emoji[] = React.useMemo(() => {
    if (debouncedValue.trim().length === 0) return [];

    return EmojiInlineIndexSearch.getInstance(data)
      .search(debouncedValue.replace(TRAILING_COLON_REGEX, ""))
      .get();
  }, [data, debouncedValue]);

  return (
    <PlateElement as="span" {...props}>
      <InlineCombobox
        inputValue={value}
        onInputValueChange={setValue}
        element={element}
        trigger=":"
        filteredItems={filteredEmojis}
      >
        <InlineComboboxInput />

        <InlineComboboxContent>
          {!isPending && <InlineComboboxEmpty>No results</InlineComboboxEmpty>}

          <InlineComboboxList>
            {(emoji: Emoji) => (
              <InlineComboboxItem
                key={emoji.id}
                value={emoji}
                onClick={() => {
                  insertEmoji(editor, emoji);
                }}
              >
                {emoji.skins[0].native} {emoji.name}
              </InlineComboboxItem>
            )}
          </InlineComboboxList>
        </InlineComboboxContent>
      </InlineCombobox>

      {children}
    </PlateElement>
  );
}
