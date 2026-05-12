import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";

const handler = createRouteHandler({ router: ourFileRouter });

export const POST = handler;
export const GET = handler;

export function getConfig() {
  return {
    render: "dynamic",
  };
}
