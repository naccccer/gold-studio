import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = path.resolve(import.meta.dirname, "..");
const uploadsRoot = path.join(repoRoot, ".local-storage", "uploads");
const cacheRoot = path.join(repoRoot, ".local-storage", "image-cache", "v1");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);
const presets = {
  tiny: { width: 96, height: 96, fit: "cover", quality: 72 },
  card: { width: 640, height: 640, fit: "cover", quality: 78 },
  preview: { width: 1024, height: 1024, fit: "inside", quality: 82, withoutEnlargement: true },
};

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

const requestedPresets = (argument("presets") || Object.keys(presets).join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const concurrency = Math.max(1, Number.parseInt(argument("concurrency") || "1", 10) || 1);
const dryRun = process.argv.includes("--dry-run");

for (const preset of requestedPresets) {
  if (!presets[preset]) throw new Error(`Unknown thumbnail preset: ${preset}`);
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await filesUnder(fullPath)));
    else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) results.push(fullPath);
  }
  return results;
}

function storageKeyFor(filePath) {
  return path.relative(path.dirname(uploadsRoot), filePath).split(path.sep).join("/");
}

function targetPath(storageKey, preset) {
  const hash = createHash("sha256").update(storageKey).digest("hex");
  return path.join(cacheRoot, preset, `${hash}.webp`);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function processFile(filePath) {
  const storageKey = storageKeyFor(filePath);
  const input = dryRun ? null : await readFile(filePath);
  let generated = 0;
  let skipped = 0;

  for (const preset of requestedPresets) {
    const outputPath = targetPath(storageKey, preset);
    if (await exists(outputPath)) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      generated += 1;
      continue;
    }

    const config = presets[preset];
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: config.width, height: config.height, fit: config.fit, withoutEnlargement: config.withoutEnlargement })
      .webp({ quality: config.quality, effort: 3 })
      .toBuffer();
    const temporaryPath = `${outputPath}.${randomUUID()}.tmp`;
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(temporaryPath, output);
    await rename(temporaryPath, outputPath);
    generated += 1;
  }

  return { generated, skipped };
}

if (process.env.STORAGE_DRIVER?.trim().toLowerCase() === "s3") {
  throw new Error("Bulk prewarm currently targets local storage; S3 thumbnails are generated and cached on demand.");
}

const files = await filesUnder(uploadsRoot);
let cursor = 0;
let generated = 0;
let skipped = 0;
const workers = Array.from({ length: Math.min(concurrency, Math.max(1, files.length)) }, async () => {
  while (cursor < files.length) {
    const filePath = files[cursor];
    cursor += 1;
    const result = await processFile(filePath);
    generated += result.generated;
    skipped += result.skipped;
  }
});
await Promise.all(workers);

console.log(`THUMBNAIL_PREWARM files=${files.length} generated=${generated} skipped=${skipped} concurrency=${concurrency} dryRun=${dryRun}`);
