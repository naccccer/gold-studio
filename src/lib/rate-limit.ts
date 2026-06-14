import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

const RATE_LIMIT_EXCEEDED_ERROR = "درخواست‌ها بیش از حد مجاز است. چند دقیقه بعد دوباره تلاش کنید.";

type RateLimitOptions = {
  scope: string;
  identifier?: string | null;
  includeClientIp?: boolean;
  limit: number;
  windowMs: number;
};

type RateLimitBucketRow = {
  key: string;
  count: number;
  resetAt: Date;
};

function cleanIdentifier(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "") || "anonymous";
}

function trustsProxyHeaders() {
  return process.env.TRUST_PROXY === "true";
}

function getClientIp(headerList: Headers) {
  if (!trustsProxyHeaders()) {
    return "unknown";
  }

  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    headerList.get("cf-connecting-ip")?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    forwardedFor ||
    "unknown"
  );
}

function rateLimitKey(parts: string[]) {
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

export async function checkRateLimit(options: RateLimitOptions) {
  const headerList = await headers();
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const keyParts = [options.scope, cleanIdentifier(options.identifier)];

  if (options.includeClientIp) {
    keyParts.push(getClientIp(headerList));
  }

  const key = rateLimitKey(keyParts);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO \`RateLimitBucket\` (\`key\`, \`count\`, \`resetAt\`, \`updatedAt\`)
      VALUES (${key}, 0, ${new Date(0)}, NOW(3))
      ON DUPLICATE KEY UPDATE \`key\` = \`key\`
    `;

    const [bucket] = await tx.$queryRaw<RateLimitBucketRow[]>`
      SELECT \`key\`, \`count\`, \`resetAt\`
      FROM \`RateLimitBucket\`
      WHERE \`key\` = ${key}
      LIMIT 1
      FOR UPDATE
    `;

    if (!bucket || bucket.resetAt.getTime() <= now.getTime()) {
      await tx.$executeRaw`
        UPDATE \`RateLimitBucket\`
        SET \`count\` = 1, \`resetAt\` = ${resetAt}, \`updatedAt\` = NOW(3)
        WHERE \`key\` = ${key}
      `;
      return { ok: true as const };
    }

    if (bucket.count >= options.limit) {
      return {
        ok: false as const,
        error: RATE_LIMIT_EXCEEDED_ERROR,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
      };
    }

    await tx.$executeRaw`
      UPDATE \`RateLimitBucket\`
      SET \`count\` = \`count\` + 1, \`updatedAt\` = NOW(3)
      WHERE \`key\` = ${key}
    `;
    return { ok: true as const };
  });
}
