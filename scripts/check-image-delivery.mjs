import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const checks = [
  ["src/lib/image-thumbnails.ts", ["tiny: { width: 96", "card: { width: 640", "preview: { width: 1024", "activeGenerations >= 1"]],
  ["src/app/api/storage/thumbnail/[preset]/[...key]/route.ts", ["private, max-age=86400", "if-none-match", "Server-Timing", "X-Thumbnail-Cache"]],
  ["src/app/admin/projects/page.tsx", ["const PAGE_SIZE = 25", "storageThumbnailUrlFromKeyOrUrl", "AdminPagination"]],
  ["src/features/admin/components/admin-image-lightbox.tsx", ["[data-admin-image-preview]"]],
  ["src/app/(dashboard)/projects/page.tsx", ["const PAGE_SIZE = 24", '"card"']],
  ["src/app/(dashboard)/gallery/page.tsx", ["const PAGE_SIZE = 24", "storageThumbnailUrl"]],
];

const failures = [];
for (const [relativePath, expectedValues] of checks) {
  const source = await readFile(path.join(repoRoot, relativePath), "utf8");
  for (const expected of expectedValues) {
    if (!source.includes(expected)) failures.push(`${relativePath}: missing ${expected}`);
  }
}

const lightbox = await readFile(path.join(repoRoot, "src/features/admin/components/admin-image-lightbox.tsx"), "utf8");
if (lightbox.includes("MutationObserver")) failures.push("Admin lightbox must not observe the entire image tree.");

if (failures.length) {
  console.error(`IMAGE_DELIVERY_CHECK_FAILED\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("IMAGE_DELIVERY_CHECK_OK");
