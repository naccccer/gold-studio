import { db } from "@/lib/db";
import { isWebVitalName } from "@/lib/web-vitals";

export const dynamic = "force-dynamic";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 120;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowRequest(request: Request) {
  const key = clientAddress(request);
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (requestBuckets.size > 5000) {
    for (const [bucketKey, bucket] of requestBuckets) {
      if (bucket.resetAt <= now) requestBuckets.delete(bucketKey);
    }
  }
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_MINUTE) return false;
  current.count += 1;
  return true;
}

function deviceType(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return new Response(null, { status: 204 });

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > 4096) return new Response(null, { status: 413 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.id !== "string" ||
      body.id.length > 128 ||
      !isWebVitalName(body.name) ||
      typeof body.value !== "number" ||
      !Number.isFinite(body.value) ||
      body.value < 0 ||
      body.value > 10_000_000 ||
      typeof body.rating !== "string" ||
      !["good", "needs-improvement", "poor"].includes(body.rating)
    ) {
      return new Response(null, { status: 400 });
    }

    const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 255) : "/";
    const navigationType = typeof body.navigationType === "string" ? body.navigationType.slice(0, 32) : null;
    const delta = typeof body.delta === "number" && Number.isFinite(body.delta) ? body.delta : null;

    await db.webVitalSample.upsert({
      where: { metricId_name: { metricId: body.id, name: body.name } },
      create: {
        metricId: body.id,
        name: body.name,
        value: body.value,
        delta,
        rating: body.rating,
        navigationType,
        path,
        deviceType: deviceType(request.headers.get("user-agent") ?? ""),
      },
      update: { value: body.value, delta, rating: body.rating, navigationType, path },
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
