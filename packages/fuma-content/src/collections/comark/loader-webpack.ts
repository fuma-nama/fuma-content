import { createComarkLoader } from "@/collections/comark/loader";
import { createWebpackLoader } from "@/plugins/loader/webpack";

export default createWebpackLoader(createComarkLoader);
