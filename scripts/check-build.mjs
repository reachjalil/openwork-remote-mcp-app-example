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
  const match = html.match(/<script\b[^>]*id=["']openwork-mcp-app["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error(`${target.file} does not contain the Remote MCP App manifest.`);
  const manifest = JSON.parse(match[1]);
  if (manifest.schemaVersion !== "openwork.remote-mcp-app/1") throw new Error(`${target.file} has the wrong schema version.`);
  if (manifest.version !== target.version) throw new Error(`${target.file} has version ${manifest.version}, expected ${target.version}.`);
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length !== 1) {
    throw new Error(`${target.file} must declare exactly one example capability.`);
  }
  const [capability] = manifest.capabilities;
  if (capability.key !== "projects" || capability.toolName !== "search_projects") {
    throw new Error(`${target.file} does not declare the expected Project search contract.`);
  }
  if (capability.access !== "read" || capability.required !== true) {
    throw new Error(`${target.file} must keep Project search required and read-only.`);
  }
  for (const forbidden of ["mockProjects", "local OpenWork Connect mock", "openwork_remote_app_project_search"]) {
    if (html.includes(forbidden)) throw new Error(`${target.file} contains local-host-only value ${forbidden}.`);
  }
  console.log(`${target.file}: ${details.size} bytes, Remote MCP App ${manifest.version}`);
}
