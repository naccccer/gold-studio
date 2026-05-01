import { createRequire } from "node:module";
import { hashSync } from "bcryptjs";
import type { UserRole } from "@/lib/auth/roles";

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
};

type PrismaLike = {
  user: {
    findUnique(args: { where: { email: string } }): Promise<UserRecord | null>;
  };
};

type PrismaClientCtor = new (options: {
  log: Array<"warn" | "error">;
}) => PrismaLike;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaLike };
const nodeRequire = createRequire(import.meta.url);

function createFallbackPrisma(): PrismaLike {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "مدیر اصلی";
  const adminUser =
    adminEmail && adminPassword
      ? {
          id: "local-admin",
          name: adminName,
          email: adminEmail,
          passwordHash: hashSync(adminPassword, 10),
          role: "ADMIN" as const,
        }
      : null;

  return {
    user: {
      async findUnique({ where }) {
        if (!adminUser) {
          return null;
        }

        return where.email.toLowerCase() === adminUser.email ? adminUser : null;
      },
    },
  };
}

function createPrismaClient() {
  try {
    const { PrismaClient } = nodeRequire("@prisma/client") as {
      PrismaClient: PrismaClientCtor;
    };

    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch {
    return createFallbackPrisma();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
