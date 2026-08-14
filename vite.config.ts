import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const app = process.env.MCP_EXAMPLE_APP ?? "project-atlas";
const appVersion = process.env.VITE_REMOTE_APP_VERSION ?? "1.0.0";

export default defineConfig({
  root: resolve("apps", app),
  base: "./",
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: resolve(".dev-build", app),
    emptyOutDir: true,
    target: "es2022",
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
