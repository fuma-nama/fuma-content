import { BaseCaptionPlugin } from "@platejs/caption";
import {
  BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
  BaseVideoPlugin,
} from "@platejs/media";
import { KEYS } from "platejs";

import { ImageElementStatic } from "@/components/editor/ui/media-image-node-static";
import { VideoElementStatic } from "@/components/editor/ui/media-video-node-static";

export const BaseMediaKit = [
  BaseImagePlugin.withComponent(ImageElementStatic),
  BaseVideoPlugin.withComponent(VideoElementStatic),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
];
