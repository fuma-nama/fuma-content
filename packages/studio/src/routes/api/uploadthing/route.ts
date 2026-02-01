import { createRouteHandler } from "uploadthing/remix";
import { ourFileRouter } from "@/lib/uploadthing";

export const { action, loader } = createRouteHandler({ router: ourFileRouter });
