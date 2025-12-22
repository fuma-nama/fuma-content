declare module "fuma-content/collections" {
  import type { StudioHandler } from "@/plugin/types";

  export interface CollectionHandlers {
    studio: StudioHandler;
  }
}
