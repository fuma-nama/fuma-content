import {
  BaseBlockquotePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseHorizontalRulePlugin,
} from "@platejs/basic-nodes";
import { BaseParagraphPlugin } from "@platejs/core";
import {
  H1ElementStatic,
  H2ElementStatic,
  H3ElementStatic,
  H4ElementStatic,
  H5ElementStatic,
  H6ElementStatic,
  HrElementStatic,
  ParagraphElementStatic,
  BlockquoteElementStatic,
} from "@/components/editor/ui/basic-nodes-static";

export const BaseBasicBlocksKit = [
  BaseParagraphPlugin.withComponent(ParagraphElementStatic),
  BaseH1Plugin.withComponent(H1ElementStatic),
  BaseH2Plugin.withComponent(H2ElementStatic),
  BaseH3Plugin.withComponent(H3ElementStatic),
  BaseH4Plugin.withComponent(H4ElementStatic),
  BaseH5Plugin.withComponent(H5ElementStatic),
  BaseH6Plugin.withComponent(H6ElementStatic),
  BaseBlockquotePlugin.withComponent(BlockquoteElementStatic),
  BaseHorizontalRulePlugin.withComponent(HrElementStatic),
];
