import { unlink } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();
const retentionDays = Number(process.env.ARCHIVE_RETENTION_DAYS ?? 14);
const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

function storageKind() {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === "s3" ? "s3" : "local";
}

function normalizeKey(key) {
  return key.split(path.sep).join("/");
}

function localPathFromKey(key) {
  const normalized = path.normalize(key);
  const uploadsRoot = `uploads${path.sep}`;

  if (normalized.startsWith("..") || path.isAbsolute(normalized) || !normalized.startsWith(uploadsRoot)) {
    throw new Error(`Invalid storage key: ${key}`);
  }

  return path.join(process.cwd(), ".local-storage", "uploads", normalized.slice(uploadsRoot.length));
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} env var is required when STORAGE_DRIVER=s3.`);
  }
  return value;
}

function normalizeStorageUrl(value) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
}

let s3Client;
function getS3Client() {
  if (s3Client) {
    return s3Client;
  }

  s3Client = new S3Client({
    region: requiredEnv("S3_REGION"),
    endpoint: normalizeStorageUrl(requiredEnv("S3_ENDPOINT")),
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE?.trim() === "true",
  });
  return s3Client;
}

function keyFromPublicUrl(url) {
  if (!url || !url.startsWith("/uploads/")) {
    return null;
  }

  return url.slice(1);
}

async function deleteStorageObject(key) {
  if (!key) {
    return;
  }

  if (storageKind() === "s3") {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: requiredEnv("S3_BUCKET"),
        Key: normalizeKey(key),
      }),
    );
    return;
  }

  try {
    await unlink(localPathFromKey(key));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function main() {
  const [projects, assets] = await Promise.all([
    prisma.project.findMany({
      where: { archivedAt: { lte: cutoff } },
      select: { id: true, resultImageUrl: true, resultStorageKey: true },
    }),
    prisma.productAsset.findMany({
      where: { archivedAt: { lte: cutoff } },
      select: { id: true, storageKey: true },
    }),
  ]);

  for (const project of projects) {
    await deleteStorageObject(project.resultStorageKey ?? keyFromPublicUrl(project.resultImageUrl));
    await prisma.project.delete({ where: { id: project.id } });
  }

  for (const asset of assets) {
    await deleteStorageObject(asset.storageKey);
    await prisma.productAsset.delete({ where: { id: asset.id } });
  }

  console.log(`Cleaned ${projects.length} archived projects and ${assets.length} archived assets.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
