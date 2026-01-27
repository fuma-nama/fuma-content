import type { FileRouter } from "uploadthing/remix";
import { createUploadthing } from "uploadthing/remix";

const f = createUploadthing();

export const ourFileRouter = {
  editorUploader: f(["image", "text", "blob", "pdf", "video", "audio"])
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.ufsUrl,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
