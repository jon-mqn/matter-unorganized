import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";

// The web app lives in web/ but imports the engine from the repo-root src/.
const engineSrc = fileURLToPath(new URL("../src", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [svelte()],
  resolve: {
    alias: {
      // Import the engine as "@engine/..." (e.g. "@engine/index.js").
      "@engine": engineSrc,
    },
  },
  server: {
    fs: {
      // Allow serving the engine source which sits outside the Vite root.
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
  build: {
    outDir: fileURLToPath(new URL("../dist-web", import.meta.url)),
    emptyOutDir: true,
  },
});
