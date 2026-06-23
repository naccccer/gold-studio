import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BACKUP_FILE_PATTERN = /^ovala-backup-[A-Za-z0-9_.-]+\.tar\.gz$/;

export type BackupArchive = {
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
  source: string;
  storageDriver?: string;
  missingOrSkipped?: number;
  sha256?: string;
};

export function backupDirectory() {
  return path.join(process.cwd(), ".local-storage", "backups");
}

export function isBackupFileName(fileName: string) {
  return BACKUP_FILE_PATTERN.test(fileName) && !fileName.includes("/") && !fileName.includes("\\");
}

export function backupFilePath(fileName: string) {
  if (!isBackupFileName(fileName)) {
    throw new Error("Invalid backup file name.");
  }
  return path.join(backupDirectory(), fileName);
}

async function readBackupMetadata(filePath: string) {
  try {
    const parsed = JSON.parse(await readFile(`${filePath}.json`, "utf8")) as {
      source?: string;
      createdAt?: string;
      completedAt?: string;
      storage?: { driver?: string; missingOrSkipped?: unknown[] };
      sha256?: string;
    };
    return parsed;
  } catch {
    return null;
  }
}

export async function listBackupArchives(): Promise<BackupArchive[]> {
  const directory = backupDirectory();
  await mkdir(directory, { recursive: true });
  const entries = await readdir(directory, { withFileTypes: true });
  const archives: BackupArchive[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !isBackupFileName(entry.name)) continue;

    const filePath = path.join(directory, entry.name);
    const [fileStat, metadata] = await Promise.all([stat(filePath), readBackupMetadata(filePath)]);
    archives.push({
      fileName: entry.name,
      sizeBytes: fileStat.size,
      createdAt: metadata?.completedAt || metadata?.createdAt ? new Date(metadata.completedAt || metadata.createdAt || fileStat.mtime) : fileStat.mtime,
      source: metadata?.source || "unknown",
      storageDriver: metadata?.storage?.driver,
      missingOrSkipped: metadata?.storage?.missingOrSkipped?.length ?? 0,
      sha256: metadata?.sha256,
    });
  }

  return archives.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteBackupArchive(fileName: string) {
  const filePath = backupFilePath(fileName);
  await rm(filePath, { force: true });
  await rm(`${filePath}.json`, { force: true });
}

export async function createBackupArchive(actorAdminId: string) {
  const marker = randomUUID();
  const scriptPath = path.join(process.cwd(), "scripts", "backup-run.mjs");
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, "--source=manual", `--actorAdminId=${actorAdminId}`],
    {
      cwd: process.cwd(),
      timeout: 40 * 60_000,
      maxBuffer: 1024 * 1024 * 8,
      env: { ...process.env, OVALA_BACKUP_REQUEST_ID: marker },
    },
  );

  const resultLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("BACKUP_RESULT "));
  if (!resultLine) {
    throw new Error(stderr.trim() || "Backup finished without a result payload.");
  }

  return JSON.parse(resultLine.slice("BACKUP_RESULT ".length)) as {
    fileName: string;
    sizeBytes: number;
    sha256: string;
  };
}

