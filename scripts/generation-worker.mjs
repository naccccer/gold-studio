import { existsSync, readFileSync } from "node:fs";

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

function integerEnv(name, fallback, minimum) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return parsed;
}

function workerUrl() {
  const configured = process.env.GENERATION_WORKER_URL?.trim();
  if (configured) return configured;

  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}/api/internal/generation/worker`;
}

function wait(ms) {
  if (stopping) return Promise.resolve();

  return new Promise((resolve) => {
    wakeSleep = resolve;
    sleepTimer = setTimeout(() => {
      sleepTimer = null;
      wakeSleep = null;
      resolve();
    }, ms);
  });
}

function nowLabel() {
  return new Date().toISOString();
}

function isConnectionRefused(error) {
  let current = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    if (current.code === "ECONNREFUSED") return true;
    current = current.cause;
  }
  return false;
}

async function tick({ url, secret, limit, staleMinutes }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit, staleMinutes }),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`worker tick failed with ${response.status}: ${text}`);
  }

  return payload;
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const secret = process.env.GENERATION_WORKER_SECRET?.trim();
if (!secret) {
  console.error("GENERATION_WORKER_SECRET env var is required.");
  process.exit(1);
}

const url = workerUrl();
const intervalMs = integerEnv("GENERATION_WORKER_INTERVAL_MS", 15000, 1000);
const errorIntervalMs = integerEnv("GENERATION_WORKER_ERROR_INTERVAL_MS", 30000, 1000);
const limit = integerEnv("GENERATION_WORKER_LIMIT", 1, 1);
const staleMinutes = integerEnv("GENERATION_STALE_PROCESSING_MINUTES", 90, 5);
let stopping = false;
let activeTick = false;
let sleepTimer = null;
let wakeSleep = null;

function requestShutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(
    `[${nowLabel()}] Ovala generation worker shutdown requested (${signal}); ${
      activeTick ? "waiting for current tick to finish" : "no active tick"
    }.`,
  );

  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
  if (wakeSleep) {
    wakeSleep();
    wakeSleep = null;
  }
}

process.on("SIGINT", () => requestShutdown("SIGINT"));
process.on("SIGTERM", () => requestShutdown("SIGTERM"));

console.log(
  `[${nowLabel()}] Ovala generation worker started: ${url} interval=${intervalMs}ms errorInterval=${errorIntervalMs}ms limit=${limit} staleMinutes=${staleMinutes}`,
);

while (!stopping) {
  try {
    activeTick = true;
    const result = await tick({ url, secret, limit, staleMinutes });
    activeTick = false;
    const processed = result?.processedProjects ?? 0;
    const recovered = (result?.recoveredProjects ?? 0) + (result?.recoveredBatches ?? 0);
    const maintenance =
      (result?.thumbnail?.processed ?? 0) +
      (result?.thumbnail?.failed ?? 0) +
      (result?.providerCosts?.resolved ?? 0) +
      (result?.thumbnailCache?.deleted ?? 0);
    if (processed > 0 || recovered > 0 || maintenance > 0) {
      console.log(`[${nowLabel()}] generation tick`, JSON.stringify(result));
    }
    if (stopping) break;
    await wait(intervalMs);
  } catch (error) {
    activeTick = false;
    const retryInMs = isConnectionRefused(error) ? Math.min(intervalMs, 5_000) : errorIntervalMs;
    console.error(`[${nowLabel()}] generation worker error; retryInMs=${retryInMs}`, error);
    if (stopping) break;
    await wait(retryInMs);
  }
}

console.log(`[${nowLabel()}] Ovala generation worker stopped.`);
