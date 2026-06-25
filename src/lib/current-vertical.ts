import "server-only";

import { cookies, headers } from "next/headers";
import { LOCAL_VERTICAL_COOKIE_NAME, resolveVerticalFromHost } from "@/lib/verticals";

export async function getCurrentVertical() {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  return resolveVerticalFromHost(
    headerList.get("x-forwarded-host") ?? headerList.get("host"),
    cookieStore.get(LOCAL_VERTICAL_COOKIE_NAME)?.value,
  );
}
