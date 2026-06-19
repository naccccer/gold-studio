// Availability smoke test for a running Ovala deployment.
//
// Checks deploy health without touching the AI/payment flows: public pages
// render or redirect as expected, protected pages redirect unauthenticated users to /login, private
// storage is not readable without a session, and (warn-only) baseline security
// headers are present.
//
// Usage:
//   node scripts/smoke-test.mjs https://test.ovala.ir
//   SMOKE_BASE_URL=https://test.ovala.ir node scripts/smoke-test.mjs
//
// Exit code is non-zero if any required check fails (warnings do not fail).

const BASE_URL = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

const results = [];

function record(ok, name, detail, { warn = false } = {}) {
  results.push({ ok, name, detail, warn });
  const tag = ok ? "PASS" : warn ? "WARN" : "FAIL";
  console.log(`[${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchNoRedirect(path, init) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, { redirect: "manual", ...init });
    return { response };
  } catch (error) {
    return { error };
  }
}

async function expectStatus(path, name, allowed) {
  const { response, error } = await fetchNoRedirect(path);
  if (error) {
    record(false, name, `request failed: ${error.message}`);
    return null;
  }
  const ok = allowed.includes(response.status);
  record(ok, name, `status ${response.status}${ok ? "" : ` (expected ${allowed.join("/")})`}`);
  return response;
}

async function expectStatusOrRedirect(path, name, allowed, allowedRedirects) {
  const { response, error } = await fetchNoRedirect(path);
  if (error) {
    record(false, name, `request failed: ${error.message}`);
    return;
  }

  const location = response.headers.get("location") || "";
  const okStatus = allowed.includes(response.status);
  const okRedirect =
    [301, 302, 303, 307, 308].includes(response.status) &&
    allowedRedirects.some((target) => location === target || location.endsWith(target));
  const expected = [...allowed.map(String), ...allowedRedirects.map((target) => `redirect ${target}`)].join("/");
  record(okStatus || okRedirect, name, `status ${response.status}${location ? ` → ${location}` : ""}${okStatus || okRedirect ? "" : ` (expected ${expected})`}`);
}

async function expectRedirectToLogin(path, name) {
  const { response, error } = await fetchNoRedirect(path);
  if (error) {
    record(false, name, `request failed: ${error.message}`);
    return;
  }
  const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
  const location = response.headers.get("location") || "";
  const ok = isRedirect && /\/login(\?|$)/.test(location);
  record(ok, name, `status ${response.status} → ${location || "(no Location)"}`);
}

async function checkHealth() {
  const { response, error } = await fetchNoRedirect("/api/health");
  if (error) {
    record(false, "health endpoint", `request failed: ${error.message}`);
    return;
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    // ignore
  }
  const ok = response.status === 200 && body?.ok === true;
  record(ok, "health endpoint", `status ${response.status} body=${JSON.stringify(body)}`);
}

async function checkSecurityHeaders() {
  const { response, error } = await fetchNoRedirect("/login");
  if (error) {
    record(false, "security headers", `request failed: ${error.message}`, { warn: true });
    return;
  }
  const wanted = {
    "x-content-type-options": "nosniff",
    "x-frame-options": null, // any value is fine
  };
  for (const [header, expected] of Object.entries(wanted)) {
    const value = response.headers.get(header);
    const present = expected ? value?.toLowerCase() === expected : Boolean(value);
    record(present, `header ${header}`, value ? `= ${value}` : "missing (see audit finding M1)", { warn: true });
  }
}

async function main() {
  console.log(`Ovala smoke test → ${BASE_URL}\n`);

  await checkHealth();

  // Public entry routes must render or redirect to the public auth entry.
  await expectStatusOrRedirect("/", "home entry", [200], ["/login"]);
  await expectStatus("/login", "login page", [200]);
  await expectStatus("/signup", "signup page", [200]);
  await expectStatus("/forgot-password", "forgot-password page", [200]);

  // Protected pages must bounce unauthenticated visitors to /login.
  await expectRedirectToLogin("/dashboard", "dashboard redirects to login");
  await expectRedirectToLogin("/gallery", "gallery redirects to login");
  await expectRedirectToLogin("/projects", "projects redirects to login");
  await expectRedirectToLogin("/account", "account redirects to login");
  await expectRedirectToLogin("/admin", "admin redirects to login");

  // Legacy /uploads path is hard-blocked by middleware.
  await expectStatus("/uploads/anything.jpg", "/uploads is blocked", [404]);

  // Private storage object must not be readable without a session.
  await expectStatus(
    "/api/storage/uploads/source/does-not-exist.jpg",
    "private storage denied without session",
    [401, 404],
  );

  // Warn-only: baseline security headers.
  await checkSecurityHeaders();

  const failures = results.filter((r) => !r.ok && !r.warn);
  const warnings = results.filter((r) => !r.ok && r.warn);
  console.log(
    `\nDone: ${results.filter((r) => r.ok).length} passed, ${failures.length} failed, ${warnings.length} warnings.`,
  );

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
