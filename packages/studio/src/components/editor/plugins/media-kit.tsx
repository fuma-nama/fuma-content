"use client";

import { CaptionPlugin } from "@platejs/caption/react";
import { ImagePlugin, PlaceholderPlugin } from "@platejs/media/react";
import { KEYS } from "platejs";

import { ImageElement } from "@/components/editor/ui/media-image-node";
import { PlaceholderElement } from "@/components/editor/ui/media-placeholder-node";
import { MediaPreviewDialog } from "@/components/editor/ui/media-preview-dialog";
import { MediaUploadToast } from "@/components/editor/ui/media-upload-toast";

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
