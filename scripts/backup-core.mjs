import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import prismaClientPackage from "../src/generated/prisma/index.js";

const execFileAsync = promisify(execFile);
const { PrismaClient } = prismaClientPackage;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const backupsDir = path.join(repoRoot, ".local-storage", "backups");
const localUploadsDir = path.join(repoRoot, ".local-storage", "uploads");

function backupRetentionCount() {
  return Math.max(1, Number.parseInt(process.env.BACKUP_RETENTION_COUNT ?? "3", 10) || 3);
}

export function loadEnvFile(filePath = path.join(repoRoot, ".env")) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pathCandidates(command, envName, commonPaths = []) {
  const configured = process.env[envName]?.trim();
  const candidates = configured ? [configured] : [];
  candidates.push(...commonPaths);

  const pathExts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  for (const directory of (process.env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    for (const extension of pathExts) {
      candidates.push(path.join(directory, command.endsWith(extension) ? command : `${command}${extension}`));
    }
  }

  return Array.from(new Set(candidates));
}

async function findExecutable(command, envName, commonPaths = []) {
  for (const candidate of pathCandidates(command, envName, commonPaths)) {
    if (await pathExists(candidate)) return candidate;
  }

  throw new Error(`${command} was not found. Set ${envName} to the executable path.`);
}

function databaseConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL env var is required.");

  const url = new URL(databaseUrl);
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!user || !database) throw new Error("DATABASE_URL must include a database user and database name.");

  return {
    host: url.hostname || "127.0.0.1",
    port: url.port || "3306",
    user,
    password,
    database,
  };
}

async function dumpDatabase(targetPath) {
  const mysqldump = await findExecutable("mysqldump", "BACKUP_MYSQLDUMP_PATH", [
    "C:\\xampp\\mysql\\bin\\mysqldump.exe",
    "/usr/bin/mysqldump",
    "/usr/local/bin/mysqldump",
  ]);
  const db = databaseConfig();
  const args = [
    `--host=${db.host}`,
    `--port=${db.port}`,
    `--user=${db.user}`,
    "--default-character-set=utf8mb4",
    "--single-transaction",
    "--routines",
    "--triggers",
    `--result-file=${targetPath}`,
    db.database,
  ];

  if (db.password) {
    args.unshift(`--password=${db.password}`);
  }

  await execFileAsync(mysqldump, args, { cwd: repoRoot, timeout: 10 * 60_000, maxBuffer: 1024 * 1024 });
}

function storageKind() {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === "s3" ? "s3" : "local";
}

function normalizeKey(key) {
  return key.split(path.sep).join("/");
}

function isAllowedStorageKey(key) {
  const normalized = normalizeKey(key);
  return normalized.startsWith("uploads/") && !normalized.includes("../") && !normalized.startsWith("/");
}

function storageKeyFromUrl(url) {
  const prefix = "/api/storage/";
  if (!url?.startsWith(prefix)) return null;
  return decodeURIComponent(url.slice(prefix.length));
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} env var is required when STORAGE_DRIVER=s3.`);
  return value;
}

function normalizeStorageUrl(value) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
}

function s3Client() {
  return new S3Client({
    region: requiredEnv("S3_REGION"),
    endpoint: normalizeStorageUrl(requiredEnv("S3_ENDPOINT")),
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE?.trim() === "true",
  });
}

async function collectStorageKeys(db) {
  const [
    productAssets,
    styleReferences,
    projects,
    purchaseRequests,
    homeSlides,
  ] = await Promise.all([
    db.productAsset.findMany({ select: { storageKey: true, fileUrl: true } }),
    db.styleReferenceAsset.findMany({ select: { storageKey: true, fileUrl: true } }),
    db.project.findMany({ select: { sourceImageUrl: true, resultStorageKey: true, resultImageUrl: true } }),
    db.purchaseRequest.findMany({ select: { receiptStorageKey: true, receiptImageUrl: true } }),
    db.homeCarouselSlide.findMany({ select: { beforeStorageKey: true, beforeImageUrl: true, afterStorageKey: true, afterImageUrl: true } }),
  ]);

  const keys = new Set();
  const add = (value) => {
    if (!value) return;
    const key = isAllowedStorageKey(value) ? value : storageKeyFromUrl(value);
    if (key && isAllowedStorageKey(key)) keys.add(normalizeKey(key));
  };

  for (const item of productAssets) {
    add(item.storageKey);
    add(item.fileUrl);
  }
  for (const item of styleReferences) {
    add(item.storageKey);
    add(item.fileUrl);
  }
  for (const item of projects) {
    add(item.sourceImageUrl);
    add(item.resultStorageKey);
    add(item.resultImageUrl);
  }
  for (const item of purchaseRequests) {
    add(item.receiptStorageKey);
    add(item.receiptImageUrl);
  }
  for (const item of homeSlides) {
    add(item.beforeStorageKey);
    add(item.beforeImageUrl);
    add(item.afterStorageKey);
    add(item.afterImageUrl);
  }

  return Array.from(keys).sort();
}

async function copyLocalStorage(workDir, manifest) {
  const target = path.join(workDir, "storage", "uploads");
  if (!(await pathExists(localUploadsDir))) {
    manifest.storage.notes.push(".local-storage/uploads does not exist.");
    return;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await cp(localUploadsDir, target, { recursive: true });
  manifest.storage.includedRoot = "storage/uploads";
}

async function copyS3Storage(db, workDir, manifest) {
  const keys = await collectStorageKeys(db);
  const client = s3Client();
  const bucket = requiredEnv("S3_BUCKET");
  manifest.storage.referencedKeys = keys.length;

  for (const key of keys) {
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!response.Body) throw new Error("empty body");

      const bytes = await response.Body.transformToByteArray();
      const targetPath = path.join(workDir, "storage", key);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, Buffer.from(bytes));
      manifest.storage.includedFiles += 1;
    } catch (error) {
      manifest.storage.missingOrSkipped.push({ key, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

async function writeManifest(workDir, manifest) {
  await writeFile(path.join(workDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function createArchive(workDir, archivePath) {
  const tar = await findExecutable("tar", "BACKUP_TAR_PATH", [
    "C:\\Windows\\System32\\tar.exe",
    "/usr/bin/tar",
    "/bin/tar",
    "/usr/local/bin/tar",
  ]);
  await execFileAsync(tar, ["-czf", archivePath, "-C", workDir, "."], {
    cwd: repoRoot,
    timeout: 30 * 60_000,
    maxBuffer: 1024 * 1024,
  });
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  hash.update(await readFile(filePath));
  return hash.digest("hex");
}

async function cleanupBackups() {
  await mkdir(backupsDir, { recursive: true });
  const entries = await readdir(backupsDir, { withFileTypes: true });
  const archives = [];

  for (const entry of entries) {
    const fullPath = path.join(backupsDir, entry.name);
    if (entry.isDirectory() && entry.name.startsWith("tmp-")) {
      await rm(fullPath, { recursive: true, force: true });
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".tar.gz")) {
      archives.push({ name: entry.name, path: fullPath, stat: await stat(fullPath) });
    }
  }

  archives.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  for (const archive of archives.slice(backupRetentionCount())) {
    await rm(archive.path, { force: true });
    await rm(`${archive.path}.json`, { force: true });
  }
}

async function logAudit(db, { actorAdminId, action, targetId, summary, metadata }) {
  await db.adminAuditEvent.create({
    data: {
      actorAdminId: actorAdminId || null,
      action,
      targetType: "Backup",
      targetId,
      summary,
      metadata,
    },
  });
}

export async function performBackup({ source = "manual", actorAdminId = null } = {}) {
  await mkdir(backupsDir, { recursive: true });
  const db = new PrismaClient();
  const backupId = `ovala-backup-${nowStamp()}-${source}-${randomUUID().slice(0, 8)}`;
  const workDir = path.join(backupsDir, `tmp-${backupId}`);
  const archivePath = path.join(backupsDir, `${backupId}.tar.gz`);
  const startedAt = new Date();
  const manifest = {
    id: backupId,
    app: "ovala",
    source,
    createdAt: startedAt.toISOString(),
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    storage: {
      driver: storageKind(),
      includedRoot: null,
      includedFiles: 0,
      referencedKeys: 0,
      missingOrSkipped: [],
      notes: [],
    },
    database: { included: true },
    retention: { keepLatest: backupRetentionCount() },
  };

  try {
    await mkdir(workDir, { recursive: true });
    await dumpDatabase(path.join(workDir, "database.sql"));

    if (manifest.storage.driver === "s3") {
      await copyS3Storage(db, workDir, manifest);
    } else {
      await copyLocalStorage(workDir, manifest);
    }

    await writeManifest(workDir, manifest);
    await createArchive(workDir, archivePath);
    const archiveStat = await stat(archivePath);
    const archiveHash = await sha256(archivePath);
    const completedAt = new Date();
    const result = {
      ...manifest,
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      fileName: path.basename(archivePath),
      sizeBytes: archiveStat.size,
      sha256: archiveHash,
    };
    await writeFile(`${archivePath}.json`, `${JSON.stringify(result, null, 2)}\n`, "utf8");

    await logAudit(db, {
      actorAdminId,
      action: source === "automatic" ? "backup.automatic.create" : "backup.manual.create",
      targetId: result.fileName,
      summary: source === "automatic" ? "بکاپ خودکار ساخته شد." : "بکاپ دستی ساخته شد.",
      metadata: {
        fileName: result.fileName,
        sizeBytes: result.sizeBytes,
        storageDriver: result.storage.driver,
        missingOrSkipped: result.storage.missingOrSkipped.length,
      },
    });

    await cleanupBackups();
    return result;
  } catch (error) {
    await logAudit(db, {
      actorAdminId,
      action: source === "automatic" ? "backup.automatic.failed" : "backup.manual.failed",
      targetId: backupId,
      summary: source === "automatic" ? "بکاپ خودکار ناموفق بود." : "بکاپ دستی ناموفق بود.",
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }).catch(() => {});
    throw error;
  } finally {
    await db.$disconnect();
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
