import { headers } from "next/headers";

const RATE_LIMIT_EXCEEDED_ERROR = "درخواست‌ها بیش از حد مجاز است. چند دقیقه بعد دوباره تلاش کنید.";

type RateLimitOptions = {
  scope: string;
  identifier?: string | null;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function cleanIdentifier(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "") || "anonymous";
}

function getClientIp(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    headerList.get("x-real-ip")?.trim() ||
    headerList.get("cf-connecting-ip")?.trim() ||
    headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 1000) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export async function checkRateLimit(options: RateLimitOptions) {
  const headerList = await headers();
  const now = Date.now();
  const key = [options.scope, cleanIdentifier(options.identifier), getClientIp(headerList)].join(":");
  const bucket = buckets.get(key);

  pruneExpiredBuckets(now);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true as const };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false as const,
      error: RATE_LIMIT_EXCEEDED_ERROR,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true as const };
}

