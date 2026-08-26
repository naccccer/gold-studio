import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/session-cookie";

export const SESSION_COOKIE = sessionCookieName();
const PERSISTENT_SESSION_SECONDS = 60 * 60 * 24 * 90;

export type UserSessionRole = "USER" | "ADMIN" | "SALES";

export function isAdminRole(role: string): role is "ADMIN" {
  return role === "ADMIN";
}

export function isAdminOrSalesRole(role: string): role is "ADMIN" | "SALES" {
  return role === "ADMIN" || role === "SALES";
}

export function postLoginPathForRole(role: string) {
  return isAdminOrSalesRole(role) ? "/admin" : "/dashboard";
}

type SessionPayload = {
  userId: string;
  role: UserSessionRole;
};

type SessionTokenPayload = SessionPayload & {
  sessionVersion: number;
};

type SignedSessionPayload = SessionTokenPayload & {
  iat: number;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is required.");
  }
  return secret;
}

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIES !== "true";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encode(payload: SessionTokenPayload) {
  const now = Math.floor(Date.now() / 1000);
  const signedPayload: SignedSessionPayload = {
    ...payload,
    iat: now,
    exp: now + PERSISTENT_SESSION_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(signedPayload), "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decode(token: string): SignedSessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed.userId || !["USER", "ADMIN", "SALES"].includes(parsed.role)) return null;
    if (!Number.isInteger(parsed.sessionVersion)) return null;
    if (!Number.isFinite(parsed.iat) || !Number.isFinite(parsed.exp)) return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      userId: parsed.userId,
      role: parsed.role,
      sessionVersion: parsed.sessionVersion,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true },
  });
  if (!user) {
    throw new Error("Cannot create a session for a missing user.");
  }

  const token = encode({ ...payload, sessionVersion: user.sessionVersion });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    maxAge: PERSISTENT_SESSION_SECONDS,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? decode(token) : null;

  if (session) {
    await db.user
      .updateMany({
        where: { id: session.userId, sessionVersion: session.sessionVersion },
        data: { sessionVersion: { increment: 1 } },
      })
      .catch((error) => {
        console.error("[session-revoke-failed]", { userId: session.userId, error });
      });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = decode(token);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { sessionVersion: true, role: true },
  });
  if (!user || user.sessionVersion !== session.sessionVersion) return null;

  return { userId: session.userId, role: user.role };
}

export async function requireUserSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireUserSession();
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return { userId: session.userId, role: "ADMIN" as const };
}

export async function requireAdminOrSalesSession() {
  const session = await requireUserSession();
  if (!isAdminOrSalesRole(session.role)) {
    redirect("/dashboard");
  }

  return { userId: session.userId, role: session.role as "ADMIN" | "SALES" };
}
