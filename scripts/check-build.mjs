import { readFile, stat } from "node:fs/promises";

const targets = [
  { file: "docs/index.html", title: "Project Atlas", version: "1.0.0" },
  { file: "docs/project-atlas/index.html", title: "Project Atlas", version: "1.0.0" },
  { file: "docs/v2/index.html", title: "Project Atlas", version: "2.0.0" },
  { file: "docs/capability-explorer/index.html", title: "Capability Explorer", version: "1.0.0" },
  { file: "docs/component-gallery/index.html", title: "MCP App Component Gallery", version: "1.0.0" },
];

for (const target of targets) {
  const html = await readFile(new URL(`../${target.file}`, import.meta.url), "utf8");
  const details = await stat(new URL(`../${target.file}`, import.meta.url));
  if (details.size > 768 * 1024) throw new Error(`${target.file} exceeds the OpenWork 768 KiB resource limit.`);
  if (!/<!doctype html/i.test(html)) throw new Error(`${target.file} is not a complete HTML document.`);
  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw new Error(`${target.file} contains an external script reference.`);
  if (/<link\b[^>]*\b(?:stylesheet|modulepreload|preload)\b/i.test(html)) throw new Error(`${target.file} contains an external link dependency.`);
  if (html.includes("MutationObserver")) throw new Error(`${target.file} contains Vite's unnecessary modulepreload observer.`);
  if (html.includes("openwork.remote-mcp-app/") || html.includes('id="openwork-mcp-app"')) {
    throw new Error(`${target.file} contains an OpenWork-specific runtime manifest.`);
  }
  if (!html.includes(`Portable revision ${target.version}`)) throw new Error(`${target.file} has the wrong portable revision marker.`);
  if (!html.includes(target.title)) throw new Error(`${target.file} is missing ${target.title}.`);
  for (const forbidden of ["project-lighthouse", "Atlas migration", "local playground host", "access_token", "client_secret"]) {
    if (html.includes(forbidden)) throw new Error(`${target.file} contains local-host-only value ${forbidden}.`);
  }
  console.log(`${target.file}: ${details.size} bytes, standard MCP App resource ${target.version}`);
}
