import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../Usage.md", import.meta.url);
const text = readFileSync(path, "utf8");
const start = text.indexOf("- [How to use the API]");
const end = text.indexOf("\n## How to use the API");
if (start < 0 || end < 0)
  throw new Error("Usage contents markers are missing.");
const toc = [...text.matchAll(/^## (.+)$/gm)]
  .map(([, title]) => {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s/g, "-");
    return `- [${title}](#${slug})`;
  })
  .join("\n");
const next = text.slice(0, start) + toc + "\n" + text.slice(end);
if (process.argv.includes("--check")) {
  if (next !== text)
    throw new Error("Usage contents are stale. Run npm run docs:sync.");
} else writeFileSync(path, next);
