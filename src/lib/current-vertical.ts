import "server-only";

import { headers } from "next/headers";
import { resolveVerticalFromHost } from "@/lib/verticals";

export async function getCurrentVertical() {
  const headerList = await headers();
  return resolveVerticalFromHost(headerList.get("x-forwarded-host") ?? headerList.get("host"));
}
