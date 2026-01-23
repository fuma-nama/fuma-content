import { createWebpackLoader } from "@/plugins/loader/webpack";
import { createJsonLoader } from "./loader";

export default createWebpackLoader((core) => createJsonLoader(core, "json"));
