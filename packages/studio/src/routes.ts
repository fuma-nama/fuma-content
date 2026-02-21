import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/index.tsx"),
    route("collection/:name", "routes/collection/page.tsx"),
    route("collection/:name/:id", "routes/collection/document/page.tsx"),

    route("api/save-doc", "routes/api/save-doc.ts"),
    route("api/ai/command", "routes/api/ai/command/route.ts"),
    route("api/ai/copilot", "routes/api/ai/copilot/route.ts"),
    route("api/uploadthing", "routes/api/uploadthing/route.ts"),
  ]),
] satisfies RouteConfig;
