import { createWebpackLoader } from "@/plugins/loader/webpack";
import { createYamlLoader } from "./loader";

export default createWebpackLoader((core) => createYamlLoader(core));
