"use client";

import emojiMartData from "@emoji-mart/data/sets/15/native.json" with { type: "json" };
import { EmojiInputPlugin, EmojiPlugin } from "@platejs/emoji/react";

import { EmojiInputElement } from "@/components/editor/ui/emoji-node";

export const EmojiKit = [
  EmojiPlugin.configure({
    options: { data: emojiMartData as any },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
