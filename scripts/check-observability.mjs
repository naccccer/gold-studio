import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

async function loadTypeScriptModule(relativePath, dependencies = {}) {
  const source = await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (name) => dependencies[name] ?? nodeRequire(name);
  new Function("require", "module", "exports", compiled)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const webVitals = await loadTypeScriptModule("src/lib/web-vitals.ts");
assert.equal(webVitals.percentile([10, 20, 30, 40], 0.75), 30);
assert.equal(webVitals.webVitalDisplayValue("CLS", 0.1234), "0.123");

const timing = await loadTypeScriptModule("src/lib/generation/timing.ts");
assert.deepEqual(
  timing.projectGenerationTiming({
    generationQueuedAt: "2026-01-01T00:00:00.000Z",
    generationStartedAt: "2026-01-01T00:00:05.000Z",
    generationFinishedAt: "2026-01-01T00:00:45.000Z",
  }),
  { totalSeconds: 45, queueSeconds: 5, processingSeconds: 40 },
);

const signatures = await loadTypeScriptModule("src/lib/thumbnail-signature.ts");
const secret = "test-secret";
const expiresAt = signatures.thumbnailSignatureExpiry(1_800_000_000_000);
const signature = signatures.createThumbnailSignature({ storageKey: "uploads/result/a.jpg", preset: "card", expiresAt, secret });
assert.equal(
  signatures.verifyThumbnailSignature({
    storageKey: "uploads/result/a.jpg",
    preset: "card",
    expiresAt,
    signature,
    secret,
    nowMs: 1_800_000_000_000,
  }),
  true,
);
assert.equal(
  signatures.verifyThumbnailSignature({
    storageKey: "uploads/result/other.jpg",
    preset: "card",
    expiresAt,
    signature,
    secret,
    nowMs: 1_800_000_000_000,
  }),
  false,
);
assert.equal(
  signatures.verifyThumbnailSignature({
    storageKey: "uploads/result/a.jpg",
    preset: "card",
    expiresAt,
    signature,
    secret,
    nowMs: (expiresAt + 1) * 1000,
  }),
  false,
);

const analytics = await loadTypeScriptModule("src/lib/ai/provider-analytics.ts", { "@/lib/web-vitals": webVitals });
const summary = analytics.summarizeProviderModels([
  { provider: "avalai", model: "flash", status: "SUCCESS", durationMs: 30_000, costUnit: "0.01", costPaidIrt: "1000", costGrantIrt: "0", costResolvedAt: new Date() },
  { provider: "avalai", model: "flash", status: "SUCCESS", durationMs: 50_000, costUnit: "0.02", costPaidIrt: "2000", costGrantIrt: "0", costResolvedAt: new Date() },
  { provider: "avalai", model: "flash", status: "FAILED", durationMs: 10_000, costUnit: null, costPaidIrt: null, costGrantIrt: null, costResolvedAt: null },
]);
assert.equal(summary[0].successPercent, 67);
assert.equal(summary[0].p50DurationMs, 30_000);
assert.equal(summary[0].p95DurationMs, 50_000);
assert.equal(summary[0].averageCostIrt, 1500);
assert.equal(summary[0].averageCostUnit, null);
assert.equal(summary[0].totalCostIrt, 3000);
assert.equal(summary[0].totalCostUnit, 0);

const unitOnlySummary = analytics.summarizeProviderModels([
  { provider: "avalai", model: "pro", status: "SUCCESS", durationMs: 40_000, costUnit: "0.04", costPaidIrt: "0", costGrantIrt: "0", costResolvedAt: new Date() },
]);
assert.equal(unitOnlySummary[0].averageCostIrt, null);
assert.equal(unitOnlySummary[0].averageCostUnit, 0.04);

const dailyCosts = analytics.summarizeProviderCostsByDay([
  {
    provider: "avalai",
    model: "flash",
    status: "SUCCESS",
    durationMs: 30_000,
    costUnit: "0.01",
    costPaidIrt: "1000",
    costGrantIrt: "0",
    costResolvedAt: new Date("2026-08-29T10:00:00Z"),
    requestId: "resolved",
    createdAt: new Date("2026-08-29T10:00:00Z"),
  },
  {
    provider: "avalai",
    model: "flash",
    status: "SUCCESS",
    durationMs: 40_000,
    costUnit: null,
    costPaidIrt: null,
    costGrantIrt: null,
    costResolvedAt: null,
    requestId: "pending",
    createdAt: new Date("2026-08-29T11:00:00Z"),
  },
]);
assert.equal(dailyCosts[0].attempts, 2);
assert.equal(dailyCosts[0].resolved, 1);
assert.equal(dailyCosts[0].pending, 1);
assert.equal(dailyCosts[0].totalCostIrt, 1000);

const workerRoute = await readFile(new URL("../src/app/api/internal/generation/worker/route.ts", import.meta.url), "utf8");
assert.match(workerRoute, /processNextThumbnailJob/);
assert.match(workerRoute, /reconcilePendingProviderCosts/);
const workerScript = await readFile(new URL("../scripts/generation-worker.mjs", import.meta.url), "utf8");
assert.match(workerScript, /ECONNREFUSED/);
assert.match(workerScript, /Math\.min\(intervalMs, 5_000\)/);
const webVitalRoute = await readFile(new URL("../src/app/api/metrics/web-vitals/route.ts", import.meta.url), "utf8");
assert.match(webVitalRoute, /webVitalSample\.upsert/);
const webVitalReporter = await readFile(new URL("../src/components/web-vitals-reporter.tsx", import.meta.url), "utf8");
assert.match(webVitalReporter, /!sampled\.current/);
assert.doesNotMatch(webVitalReporter, /metric\.rating !== ["']poor["']/);
const billingPage = await readFile(new URL("../src/app/admin/billing/page.tsx", import.meta.url), "utf8");
assert.match(billingPage, /هزینه هوش مصنوعی/);
assert.match(billingPage, /summarizeProviderCostsByDay/);
const adminConsole = await readFile(new URL("../src/features/admin/components/console.tsx", import.meta.url), "utf8");
assert.match(adminConsole, /scope="col"/);
assert.match(adminConsole, /border-collapse/);

console.log("OBSERVABILITY_CHECK_OK");
