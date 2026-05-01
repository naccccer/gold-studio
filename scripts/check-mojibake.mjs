import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = ["src", "docs", "prisma", "roadmap.md", "package.json"];
const suspiciousPattern = /Ã|â€|â€“|â€”|â€\u008c|â€\u008d|�/;
const ignoredDirectories = new Set(["node_modules", ".next", ".git"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".prisma", ".css"]);
const matches = [];

async function walk(entry) {
  const absolutePath = path.join(root, entry);
  const stats = await import("node:fs/promises").then(({ stat }) => stat(absolutePath));

  if (stats.isDirectory()) {
    if (ignoredDirectories.has(path.basename(entry))) {
      return;
    }

    const children = await readdir(absolutePath);
    await Promise.all(
      children.map((child) => walk(path.join(entry, child))),
    );
    return;
  }

  if (!textExtensions.has(path.extname(entry))) {
    return;
  }

  const content = await readFile(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (suspiciousPattern.test(line)) {
      matches.push(`${entry}:${index + 1}`);
    }
  });
}

await Promise.all(targets.map((entry) => walk(entry)));

if (matches.length > 0) {
  console.error("Possible mojibake found:");
  matches.forEach((match) => console.error(`- ${match}`));
  process.exit(1);
}

console.log("No mojibake patterns detected.");
