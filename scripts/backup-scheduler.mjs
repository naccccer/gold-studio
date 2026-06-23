import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnvFile } from "./backup-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

loadEnvFile();
loadEnvFile(".env.local");

const timezone = process.env.BACKUP_TIMEZONE?.trim() || "Asia/Tehran";
const targetHour = Number.parseInt(process.env.BACKUP_SCHEDULE_HOUR ?? "3", 10);
const targetMinute = Number.parseInt(process.env.BACKUP_SCHEDULE_MINUTE ?? "0", 10);
const checkIntervalMs = Math.max(10_000, Number.parseInt(process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? "60000", 10) || 60_000);

let stopping = false;
let running = false;
let lastRunDate = "";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tehranParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number.parseInt(value("hour"), 10),
    minute: Number.parseInt(value("minute"), 10),
  };
}

function runBackup() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/backup-run.mjs", "--source=automatic"], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`backup exited with ${code}`))));
    child.on("error", reject);
  });
}

process.on("SIGINT", () => {
  stopping = true;
});

process.on("SIGTERM", () => {
  stopping = true;
});

console.log(`[${new Date().toISOString()}] Ovala backup scheduler started: ${timezone} ${targetHour}:${String(targetMinute).padStart(2, "0")}`);

while (!stopping) {
  const current = tehranParts();
  const shouldRun =
    current.hour === targetHour &&
    current.minute >= targetMinute &&
    current.minute <= targetMinute + 10 &&
    current.date !== lastRunDate;

  if (shouldRun && !running) {
    running = true;
    lastRunDate = current.date;
    try {
      await runBackup();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] scheduled backup failed`, error);
    } finally {
      running = false;
    }
  }

  await wait(checkIntervalMs);
}

console.log(`[${new Date().toISOString()}] Ovala backup scheduler stopped.`);
