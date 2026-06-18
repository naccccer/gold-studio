import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function integerEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, minimum), maximum);
}

function applyDefaultSearchParam(url: URL, name: string, value: string) {
  if (!url.searchParams.has(name)) {
    url.searchParams.set(name, value);
  }
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL env var is required.");
  }

  const normalizedUrl = url.replace(/^mysql:\/\//, "mariadb://");

  try {
    const parsedUrl = new URL(normalizedUrl);
    applyDefaultSearchParam(parsedUrl, "connectionLimit", String(integerEnv("DATABASE_CONNECTION_LIMIT", 5, 1, 20)));
    applyDefaultSearchParam(parsedUrl, "minimumIdle", String(integerEnv("DATABASE_POOL_MINIMUM_IDLE", 1, 0, 20)));
    applyDefaultSearchParam(parsedUrl, "idleTimeout", String(integerEnv("DATABASE_POOL_IDLE_TIMEOUT_SECONDS", 60, 10, 3600)));
    applyDefaultSearchParam(parsedUrl, "acquireTimeout", String(integerEnv("DATABASE_POOL_ACQUIRE_TIMEOUT_MS", 15000, 1000, 60000)));
    applyDefaultSearchParam(parsedUrl, "connectTimeout", String(integerEnv("DATABASE_CONNECT_TIMEOUT_MS", 5000, 1000, 30000)));

    return parsedUrl.toString();
  } catch {
    return normalizedUrl;
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(getDatabaseUrl(), {
      onConnectionError(error) {
        console.error("Database connection error", error);
      },
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = db;
