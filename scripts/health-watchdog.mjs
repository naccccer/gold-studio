import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

function integerEnv(name, fallback, minimum, maximum) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, minimum), maximum);
}

function nowLabel() {
  return new Date().toISOString();
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runCommand(label, command, args) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 20_000,
      env: {
        ...process.env,
        http_proxy: "",
        https_proxy: "",
        HTTP_PROXY: "",
        HTTPS_PROXY: "",
        all_proxy: "",
        ALL_PROXY: "",
      },
    });
    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    if (output) {
      console.error(`[${nowLabel()}] watchdog ${label}\n${output}`);
    }
  } catch (error) {
    console.error(`[${nowLabel()}] watchdog ${label} failed`, error);
  }
}

async function checkHealth(url, timeoutMs) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`health returned ${response.status}: ${text.slice(0, 500)}`);
  }

  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`health returned non-json body: ${text.slice(0, 500)}`);
  }

  if (payload?.ok !== true) {
    throw new Error(`health returned unhealthy body: ${text.slice(0, 500)}`);
  }
}

async function restartApp(appName) {
  await runCommand("pm2 status before restart", "pm2", ["status", "--no-color"]);
  await runCommand(`restarting ${appName}`, "pm2", ["restart", appName, "--update-env"]);
  await runCommand("pm2 status after restart", "pm2", ["status", "--no-color"]);
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const url = process.env.HEALTH_WATCHDOG_URL?.trim() || "http://127.0.0.1:3000/api/health";
const appName = process.env.HEALTH_WATCHDOG_PM2_APP?.trim() || "gold-studio";
const intervalMs = integerEnv("HEALTH_WATCHDOG_INTERVAL_MS", 30_000, 5_000, 10 * 60_000);
const timeoutMs = integerEnv("HEALTH_WATCHDOG_TIMEOUT_MS", 10_000, 1_000, 60_000);
const failureThreshold = integerEnv("HEALTH_WATCHDOG_FAILURE_THRESHOLD", 4, 1, 20);
const restartCooldownMs = integerEnv("HEALTH_WATCHDOG_RESTART_COOLDOWN_MS", 120_000, 30_000, 30 * 60_000);

let failures = 0;
let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
});

process.on("SIGTERM", () => {
  stopping = true;
});

console.log(
  `[${nowLabel()}] Ovala health watchdog started: ${url} app=${appName} interval=${intervalMs}ms threshold=${failureThreshold}`,
);

while (!stopping) {
  try {
    await checkHealth(url, timeoutMs);
    if (failures > 0) {
      console.log(`[${nowLabel()}] health recovered after ${failures} failure(s).`);
    }
    failures = 0;
    await wait(intervalMs);
  } catch (error) {
    failures += 1;
    console.error(`[${nowLabel()}] health check failed (${failures}/${failureThreshold})`, error);

    if (failures >= failureThreshold) {
      console.error(`[${nowLabel()}] restarting ${appName} after ${failures} consecutive health failures.`);
      await restartApp(appName);
      failures = 0;
      await wait(restartCooldownMs);
    } else {
      await wait(intervalMs);
    }
  }
}

console.log(`[${nowLabel()}] Ovala health watchdog stopped.`);
