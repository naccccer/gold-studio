import { NextResponse } from "next/server";
import { getPublicHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getPublicHealth();
  return NextResponse.json(health.body, { status: health.status });
}
