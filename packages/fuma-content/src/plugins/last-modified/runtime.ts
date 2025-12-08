import { composerAttachCompiled } from "@/collections/mdx/runtime";

export function composerLastModified() {
  return composerAttachCompiled<{
    /**
     * Last modified date of document file, obtained from version control.
     *
     */
    lastModified?: Date;
  }>();
}
