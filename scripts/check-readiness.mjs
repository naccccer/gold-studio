import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import ts from "typescript";

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
const verticalsSource = await read("src/lib/verticals.ts");

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

const verticalsOutput = ts.transpileModule(verticalsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const verticalsModuleUrl = `data:text/javascript;base64,${Buffer.from(verticalsOutput).toString("base64")}`;
const { resolveVerticalFromHost } = await import(verticalsModuleUrl);
const originalLocalVertical = process.env.OVALA_LOCAL_VERTICAL;
try {
  delete process.env.OVALA_LOCAL_VERTICAL;
  assert.equal(resolveVerticalFromHost("ovala.ir"), "jewelry", "Default host should resolve to Jewelry");
  assert.equal(resolveVerticalFromHost("food.ovala.ir"), "food", "Food subdomain should resolve to Food");
  assert.equal(resolveVerticalFromHost("localhost:3000"), "jewelry", "Localhost should default to Jewelry");
  process.env.OVALA_LOCAL_VERTICAL = "food";
  assert.equal(resolveVerticalFromHost("localhost:3000"), "food", "Local Food override should resolve to Food");
  process.env.OVALA_LOCAL_VERTICAL = "clothing";
  assert.equal(resolveVerticalFromHost("localhost:3000"), "jewelry", "Reserved future verticals should not activate user-facing local routing");
} finally {
  if (originalLocalVertical === undefined) {
    delete process.env.OVALA_LOCAL_VERTICAL;
  } else {
    process.env.OVALA_LOCAL_VERTICAL = originalLocalVertical;
  }
}

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
