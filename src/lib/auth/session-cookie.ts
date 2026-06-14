const DEFAULT_SESSION_COOKIE = "gold_session";

export function sessionCookieName() {
  return process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE;
}
