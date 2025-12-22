"use client";

import Blockquote from "@tiptap/extension-blockquote";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { ListKit } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./tiptap.css";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Highlight,
      Image,
      Blockquote,
      Subscript,
      Superscript,
      ListKit,
      TextAlign,
    ],
    editorProps: {
      attributes: {
        class:
          "overflow-hidden rounded-lg border bg-card text-card-foreground p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      },
    },
    content: "# Hello World",
    contentType: "markdown",
    immediatelyRender: false,
  });

  return <EditorContent editor={editor} />;
};

export default Tiptap;
