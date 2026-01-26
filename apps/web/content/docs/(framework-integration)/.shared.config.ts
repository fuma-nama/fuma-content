import { defineConfig } from "fuma-content/config";
import { mdxCollection } from "fuma-content/collections/mdx";

const docs = mdxCollection({
  dir: "content/docs",
});

export default defineConfig({
  collections: { docs },
});
