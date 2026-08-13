import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const appVersion = process.env.VITE_REMOTE_APP_VERSION ?? "1.0.0";
const outDir = process.env.VITE_REMOTE_APP_OUT_DIR ?? "docs";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir,
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
