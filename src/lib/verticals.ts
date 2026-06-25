export const DEFAULT_VERTICAL_ID = "jewelry";

export const VERTICALS = {
  jewelry: {
    id: "jewelry",
    label: "Jewelry",
    isLaunchReady: true,
    hostSubdomains: [],
  },
  food: {
    id: "food",
    label: "Food & Drink",
    isLaunchReady: true,
    hostSubdomains: ["food"],
  },
  clothing: {
    id: "clothing",
    label: "Clothing",
    isLaunchReady: false,
    hostSubdomains: [],
  },
  furniture: {
    id: "furniture",
    label: "Furniture",
    isLaunchReady: false,
    hostSubdomains: [],
  },
} as const;

export type VerticalId = keyof typeof VERTICALS;

export const VERTICAL_IDS = Object.keys(VERTICALS) as VerticalId[];
export const USER_VISIBLE_VERTICAL_IDS = ["jewelry", "food"] as const satisfies readonly VerticalId[];
export type UserVisibleVerticalId = (typeof USER_VISIBLE_VERTICAL_IDS)[number];
export const LOCAL_VERTICAL_COOKIE_NAME = "ovala_local_vertical";

function normalizeHost(host: string | null | undefined) {
  const value = host?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!value) {
    return "";
  }

  if (value.startsWith("[")) {
    return value.slice(1, value.indexOf("]"));
  }

  return value.split(":")[0] ?? "";
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1";
}

export function isLocalDevelopmentHost(host: string | null | undefined) {
  return isLocalHost(normalizeHost(host));
}

export function isVerticalId(value: unknown): value is VerticalId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(VERTICALS, value);
}

export function normalizeVerticalId(value: unknown): VerticalId {
  return isVerticalId(value) ? value : DEFAULT_VERTICAL_ID;
}

export function normalizeUserVisibleVerticalId(value: unknown): UserVisibleVerticalId {
  const vertical = normalizeVerticalId(value);
  return (USER_VISIBLE_VERTICAL_IDS as readonly string[]).includes(vertical) ? (vertical as UserVisibleVerticalId) : DEFAULT_VERTICAL_ID;
}

export function getVerticalLabel(value: unknown) {
  return VERTICALS[normalizeVerticalId(value)].label;
}

function readCookie(cookieHeader: string | null | undefined, name: string) {
  const cookies = cookieHeader?.split(";") ?? [];
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.split("=");
    if (rawKey?.trim() !== name) {
      continue;
    }

    return decodeURIComponent(rawValue.join("=").trim());
  }

  return null;
}

export function resolveVerticalFromHost(host: string | null | undefined, localOverride?: string | null): VerticalId {
  const hostname = normalizeHost(host);
  if (!hostname) {
    return normalizeUserVisibleVerticalId(localOverride ?? process.env.OVALA_LOCAL_VERTICAL);
  }

  if (isLocalHost(hostname)) {
    return normalizeUserVisibleVerticalId(localOverride ?? process.env.OVALA_LOCAL_VERTICAL);
  }

  for (const vertical of USER_VISIBLE_VERTICAL_IDS) {
    if (VERTICALS[vertical].hostSubdomains.some((subdomain) => hostname === subdomain || hostname.startsWith(`${subdomain}.`))) {
      return vertical;
    }
  }

  return DEFAULT_VERTICAL_ID;
}

export function resolveVerticalFromRequest(request: Request): VerticalId {
  const localOverride = readCookie(request.headers.get("cookie"), LOCAL_VERTICAL_COOKIE_NAME);
  return resolveVerticalFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"), localOverride);
}
