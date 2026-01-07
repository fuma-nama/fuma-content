import type { TElement } from "platejs";
import { useMemo } from "react";
import { useEditor } from "@/components/editor/editor-kit";

/**
 *  Check if current user is the creator of this element (for Yjs collaboration)
 */
export function useIsCreator(element: TElement) {
  const editor = useEditor();

  return useMemo(() => {
    const elementUserId =
      "userId" in element && typeof element.userId === "string" ? element.userId : undefined;
    const currentUserId = editor.meta.userId;

    // If no userId (backwards compatibility or non-Yjs), allow
    if (!elementUserId) return true;

    return elementUserId === currentUserId;
  }, [editor.meta.userId, element]);
}
