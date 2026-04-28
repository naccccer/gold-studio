import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const markerPattern = /[ÃÂØÙÛÚâ�]/;
const ignoredDirs = new Set(["node_modules", ".next", "dist", "build"]);
const ignoredPathParts = new Set(["public/uploads"]);
const textExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);

const rootMarkdownFiles = ["AGENTS.md", "CLAUDE.md", "README.md", "roadmap.md"];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function shouldIgnorePath(filePath) {
  const normalized = normalizePath(path.relative(root, filePath));
  return [...ignoredPathParts].some((part) => normalized.startsWith(part));
}

function isAllowedMarkerLine(relativePath, line) {
  return relativePath === "docs/conventions.md" && line.includes("If Persian appears as");
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name) || shouldIgnorePath(fullPath)) {
        continue;
      }
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const scanTargets = [
    ...await collectFiles(path.join(root, "src")),
    ...await collectFiles(path.join(root, "docs")),
    ...rootMarkdownFiles.map((file) => path.join(root, file)),
  ];

  let found = false;

  for (const filePath of scanTargets) {
    const relativePath = normalizePath(path.relative(root, filePath));
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!markerPattern.test(line) || isAllowedMarkerLine(relativePath, line)) {
        return;
      }

      found = true;
      console.log(`${relativePath}:${index + 1}: ${line}`);
    });
  }

  process.exit(found ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
