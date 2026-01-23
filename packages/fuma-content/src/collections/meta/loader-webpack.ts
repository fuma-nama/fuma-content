import { createWebpackLoader } from "@/plugins/loader/webpack";
import { createMetaLoader } from "./loader";

export default createWebpackLoader((core) =>
  createMetaLoader(core, {
    json: "json",
  }),
);
