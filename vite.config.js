import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(process.cwd(), "frontend"),
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
  build: { outDir: resolve(process.cwd(), "frontend/dist"), emptyOutDir: true },
});
