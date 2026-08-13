import { readFile, stat } from "node:fs/promises";

const targets = [
  { file: "docs/index.html", version: "1.0.0" },
  { file: "docs/v2/index.html", version: "2.0.0" },
];

for (const target of targets) {
  const html = await readFile(new URL(`../${target.file}`, import.meta.url), "utf8");
  const details = await stat(new URL(`../${target.file}`, import.meta.url));
  if (details.size > 768 * 1024) throw new Error(`${target.file} exceeds the OpenWork 768 KiB resource limit.`);
  if (!/<!doctype html/i.test(html)) throw new Error(`${target.file} is not a complete HTML document.`);
  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw new Error(`${target.file} contains an external script reference.`);
  if (/<link\b[^>]*\b(?:stylesheet|modulepreload|preload)\b/i.test(html)) throw new Error(`${target.file} contains an external link dependency.`);
  if (html.includes("openwork.remote-mcp-app/") || html.includes('id="openwork-mcp-app"')) {
    throw new Error(`${target.file} contains an OpenWork-specific runtime manifest.`);
  }
  if (!html.includes(`Portable revision ${target.version}`)) throw new Error(`${target.file} has the wrong portable revision marker.`);
  if (!html.includes("search_projects")) throw new Error(`${target.file} does not call the native same-server Project search tool.`);
  for (const forbidden of ["mockProjects", "local standard MCP server mock", "openwork_remote_app_project_search"]) {
    if (html.includes(forbidden)) throw new Error(`${target.file} contains local-host-only value ${forbidden}.`);
  }
  console.log(`${target.file}: ${details.size} bytes, standard MCP App resource ${target.version}`);
}
