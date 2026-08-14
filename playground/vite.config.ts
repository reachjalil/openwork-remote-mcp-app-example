import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  publicDir: resolve(import.meta.dirname, "../docs"),
  server: { port: 5173 },
});
