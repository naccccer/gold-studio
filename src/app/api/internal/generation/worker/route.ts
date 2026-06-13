import { NextResponse } from "next/server";
import { processQueuedGenerationJobs } from "@/lib/generation/jobs";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 3;
const DEFAULT_STALE_MINUTES = 45;

function workerSecret() {
  return process.env.GENERATION_WORKER_SECRET?.trim() || "";
}

function unauthorized() {
  return NextResponse.json({ error: "Worker access denied." }, { status: 401 });
}

function parsePositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, parsed);
}

async function requestJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const secret = workerSecret();
  if (!secret) {
    return NextResponse.json({ error: "GENERATION_WORKER_SECRET env var is required." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const body = await requestJson(request);
  const limit = parsePositiveInteger(body.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const staleMinutes = parsePositiveInteger(
    body.staleMinutes ?? process.env.GENERATION_STALE_PROCESSING_MINUTES,
    DEFAULT_STALE_MINUTES,
    24 * 60,
  );

  const result = await processQueuedGenerationJobs({
    limit,
    staleProcessingMs: staleMinutes * 60 * 1000,
  });

  return NextResponse.json({
    ok: true,
    limit,
    staleMinutes,
    ...result,
  });
}
