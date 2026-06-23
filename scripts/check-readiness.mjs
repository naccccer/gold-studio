import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const requiredDocs = [
  "README.md",
  "PRODUCT.md",
  "AGENTS.md",
  "CLAUDE.md",
  "roadmap.md",
  "docs/deployment-runbook.md",
  "docs/launch-readiness.md",
  "docs/repo-readiness.md",
  "docs/local-pc-switch.md",
  "docs/proxy.md",
  "docs/staging-deploy.md",
  "docs/staging-update-latest.md",
];

const files = Object.fromEntries(await Promise.all(requiredDocs.map(async (path) => [path, await read(path)])));
const readme = files["README.md"];
const packageJson = JSON.parse(await read("package.json"));
const cleanupArchives = await read("scripts/cleanup-archives.mjs");
const envExample = await read(".env.example");

for (const path of requiredDocs) {
  assert.ok(files[path]?.trim(), `${path} should exist and not be empty`);
}

for (const path of ["docs/launch-readiness.md", "docs/repo-readiness.md", "docs/deployment-runbook.md"]) {
  assert.ok(readme.includes(path), `README should link ${path}`);
}

for (const script of [
  "check:prompts",
  "check:model-routing",
  "check:mojibake",
  "lint",
  "build",
  "smoke",
  "worker:generation",
  "watchdog:health",
  "cleanup:archives",
]) {
  assert.ok(packageJson.scripts?.[script], `package.json should define ${script}`);
  assert.ok(readme.includes(script) || files["CLAUDE.md"].includes(script), `${script} should be documented`);
}

assert.ok(cleanupArchives.includes('".local-storage", "uploads"'), "cleanup:archives should delete local files from .local-storage/uploads");
assert.ok(!cleanupArchives.includes('"public", "uploads"'), "cleanup:archives must not delete from public/uploads");

for (const envName of [
  "DATABASE_URL",
  "AUTH_SECRET",
  "ALLOW_INSECURE_COOKIES",
  "TRUST_PROXY",
  "SESSION_COOKIE_NAME",
  "IMAGE_PROVIDER",
  "GENERATION_WORKER_SECRET",
  "HEALTH_WATCHDOG_URL",
  "LIARA_API_KEY",
  "LIARA_VISION_API_KEY",
  "AVALAI_API_KEY",
  "FARAZSMS_API_KEY",
  "STORAGE_DRIVER",
]) {
  assert.ok(envExample.includes(`${envName}=`), `.env.example should include ${envName}`);
}

const staleDocs = [
  ["PRODUCT.md", /before launch/i],
  ["AGENTS.md", /single Next\.js repo for MVP/i],
  ["roadmap.md", /pre-launch/i],
];

for (const [path, pattern] of staleDocs) {
  assert.doesNotMatch(files[path], pattern, `${path} should not use stale launch/MVP wording`);
}

console.log("Repo readiness checks passed.");
