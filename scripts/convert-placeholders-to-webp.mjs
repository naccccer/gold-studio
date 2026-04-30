import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inputDir = path.resolve("raw-placeholders");
const outputDir = path.resolve("public/images/placeholders/jewelry");

const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const outputNames = [
  "home-hero.webp",
  "upload-preview.webp",
  "result-hero-dark.webp",
  "style-minimal.webp",
  "style-dark.webp",
  "style-editorial.webp",
  "style-natural.webp",
  "style-gold.webp",
  "archive-01.webp",
  "archive-02.webp",
  "archive-03.webp",
  "archive-04.webp",
  "archive-05.webp",
  "archive-06.webp",
  "archive-07.webp",
  "archive-08.webp",
  "jewelry-extra-01.webp",
  "jewelry-extra-02.webp",
  "jewelry-extra-03.webp",
  "jewelry-extra-04.webp",
  "jewelry-extra-05.webp",
  "jewelry-extra-06.webp",
  "jewelry-extra-07.webp",
  "jewelry-extra-08.webp",
  "jewelry-extra-09.webp",
];

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  const rawFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  if (rawFiles.length > outputNames.length) {
    throw new Error(
      `Found ${rawFiles.length} raw files, but only ${outputNames.length} output names are configured.`,
    );
  }

  const staleOutputs = await fs.readdir(outputDir, { withFileTypes: true });
  await Promise.all(
    staleOutputs
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".webp")
      .map((entry) => fs.unlink(path.join(outputDir, entry.name))),
  );

  const generatedFiles = [];

  for (const [index, rawFile] of rawFiles.entries()) {
    const outputName = outputNames[index];
    const inputPath = path.join(inputDir, rawFile);
    const outputPath = path.join(outputDir, outputName);

    await sharp(inputPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);

    generatedFiles.push(outputName);
  }

  console.log(`Raw files found: ${rawFiles.length}`);
  console.log(`WebP files generated: ${generatedFiles.length}`);
  console.log("Output files:");
  for (const fileName of generatedFiles) {
    console.log(`- ${fileName}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
