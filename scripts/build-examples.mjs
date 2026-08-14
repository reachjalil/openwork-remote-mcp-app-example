import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const repositoryRoot = resolve(import.meta.dirname, "..");
const docsRoot = resolve(repositoryRoot, "docs");
const targets = [
  { app: "project-atlas", version: "1.0.0", outDir: docsRoot },
  { app: "project-atlas", version: "2.0.0", outDir: resolve(docsRoot, "v2") },
  { app: "capability-explorer", version: "1.0.0", outDir: resolve(docsRoot, "capability-explorer") },
  { app: "component-gallery", version: "1.0.0", outDir: resolve(docsRoot, "component-gallery") },
];

await rm(docsRoot, { recursive: true, force: true });
for (const target of targets) {
  process.env.VITE_REMOTE_APP_VERSION = target.version;
  await build({
    configFile: false,
    root: resolve(repositoryRoot, "apps", target.app),
    base: "./",
    plugins: [react(), viteSingleFile()],
    define: { __APP_VERSION__: JSON.stringify(target.version) },
    build: {
      outDir: target.outDir,
      emptyOutDir: true,
      target: "es2022",
      modulePreload: false,
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
    },
  });
  const file = resolve(target.outDir, "index.html");
  const html = await readFile(file, "utf8");
  await writeFile(file, html.replace(/[\t ]+$/gm, ""));
}

await mkdir(resolve(docsRoot, "project-atlas"), { recursive: true });
await copyFile(resolve(docsRoot, "index.html"), resolve(docsRoot, "project-atlas", "index.html"));
