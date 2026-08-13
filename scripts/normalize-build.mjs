import { readFile, writeFile } from "node:fs/promises";

for (const file of ["docs/index.html", "docs/v2/index.html"]) {
  const url = new URL(`../${file}`, import.meta.url);
  const html = await readFile(url, "utf8");
  await writeFile(url, html.replace(/[\t ]+$/gm, ""));
}
