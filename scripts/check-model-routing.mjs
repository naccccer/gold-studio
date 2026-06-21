import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/ai/model-routing.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const { clampNon4KImageSetting, providerImageModelsForRouting, resolveModelRoutingDecision } = await import(moduleUrl);

const hardStyles = ["style_with_model", "style_sample_reference"];
for (const styleId of hardStyles) {
  const decision = resolveModelRoutingDecision({ styleId, operation: "image.edit" });
  assert.equal(decision.routing, "hard", `${styleId} should use hard routing`);
  assert.equal(decision.reason, styleId, `${styleId} should be recorded as routing reason`);
}

for (const styleId of ["style_clean_white", "style_social_media", "style_soft_editorial", "style_dramatic_dark"]) {
  const decision = resolveModelRoutingDecision({ styleId, operation: "image.edit" });
  assert.equal(decision.routing, "easy", `${styleId} should use easy routing`);
  assert.equal(decision.reason, "default", `${styleId} should use default routing reason`);
}

assert.deepEqual(providerImageModelsForRouting("avalai", "hard").slice(0, 3), [
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image",
]);
assert.deepEqual(providerImageModelsForRouting("avalai", "easy").slice(0, 3), [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image",
]);
assert.deepEqual(providerImageModelsForRouting("liara", "hard").slice(0, 2), [
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image",
]);
assert.deepEqual(providerImageModelsForRouting("liara", "easy").slice(0, 2), [
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
]);

assert.equal(providerImageModelsForRouting("avalai", "hard").at(-1), "gpt-image-2");
assert.equal(providerImageModelsForRouting("avalai", "easy").at(-1), "gpt-image-2");
assert.equal(providerImageModelsForRouting("liara", "hard").at(-1), "openai/gpt-image-2");
assert.equal(providerImageModelsForRouting("liara", "easy").at(-1), "openai/gpt-image-2");

assert.equal(clampNon4KImageSetting("4K", "2K"), "2K");
assert.equal(clampNon4KImageSetting(" 4K ", "2K"), "2K");
assert.equal(clampNon4KImageSetting("1K", "2K"), "1K");
assert.equal(clampNon4KImageSetting(undefined, "2K"), "2K");

console.log("Model routing checks passed.");
