import { defineConfig } from "vite";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Multi-page build: the 3D page plus every generated info page in src/<slug>/index.html.
const root = resolve(import.meta.dirname, "src");
const input = { main: resolve(root, "index.html") };
for (const d of readdirSync(root, { withFileTypes: true })) if (d.isDirectory() && existsSync(resolve(root, d.name, "index.html"))) input[d.name] = resolve(root, d.name, "index.html");

export default defineConfig({
  root,
  esbuild: { jsx: "automatic" },
  publicDir: resolve(import.meta.dirname, "public"),
  build: {
    outDir: resolve(import.meta.dirname, "dist"), emptyOutDir: true, target: "es2020", chunkSizeWarningLimit: 700,
    rollupOptions: { input, output: { manualChunks: (id) => (id.includes("node_modules/three") ? "three" : undefined) } },
  },
  server: { host: true },
});
