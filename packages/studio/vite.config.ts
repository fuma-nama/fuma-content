import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouterRSC(), rsc(), tsconfigPaths()],
  server: {
    port: 3000,
  },
  resolve: {
    external: ["fuma-content"],
    noExternal: ["katex", "@platejs/math", "@platejs/slate", "@udecode/utils", "slate-dom"],
  },
});
