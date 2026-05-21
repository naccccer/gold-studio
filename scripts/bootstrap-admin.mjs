import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/index.js";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

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

function argValue(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1];

  return "";
}

function normalizeEmail(value) {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function referralCodeFromUserId(userId) {
  return userId.slice(-5).toLowerCase();
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const email = normalizeEmail(argValue("email"));
  const password = argValue("password");
  const name = argValue("name").trim() || "Ovala Admin";

  if (!email || password.length < 6) {
    console.error("Usage: npm run admin:bootstrap -- --email admin@example.com --password strong-password [--name \"Admin Name\"]");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL env var is required.");
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });

  try {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          name: existing.name || name,
          passwordHash: await hashPassword(password),
          referralCode: existing.referralCode || referralCodeFromUserId(existing.id),
        },
      });
      console.log(`Promoted existing user ${email} to ADMIN.`);
      return;
    }

    const created = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        credits: 0,
      },
    });

    await db.user.update({
      where: { id: created.id },
      data: { referralCode: referralCodeFromUserId(created.id) },
    });

    console.log(`Created ADMIN user ${email}.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

