import { createMdxLoader } from "@/collections/mdx/loader";
import { createWebpackLoader } from "@/plugins/loader/webpack";

export default createWebpackLoader(createMdxLoader);
