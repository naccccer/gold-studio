import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/ai/style-policy.ts", import.meta.url), "utf8");
const sampleReferenceSource = await readFile(new URL("../src/lib/style-reference-vision.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const { buildProductOnlyIsolationPrompt, isHumanWearableStyle, isProductOnlyStyle } = await import(moduleUrl);

const catalogStyle = { id: "style_clean_white", controls: [] };
const sampleReferenceStyle = { id: "style_sample_reference", controls: [] };
const modelStyle = { id: "style_with_model", controls: [{ key: "modelGender" }] };
const customModelStyle = { id: "custom_model", controls: [{ key: "faceFraming" }] };

assert.equal(isProductOnlyStyle(catalogStyle), true, "catalog style should be product-only");
assert.equal(isProductOnlyStyle(sampleReferenceStyle), true, "sample reference should be product-only unless explicitly wearable");
assert.equal(isHumanWearableStyle(modelStyle), true, "style_with_model should allow human context");
assert.equal(isHumanWearableStyle(customModelStyle), true, "human controls should mark a style as wearable");

const watchIsolationPrompt = buildProductOnlyIsolationPrompt({
  style: catalogStyle,
  productType: "ساعت",
  visionAngle: "worn",
});
assert.match(watchIsolationPrompt, /Remove and do not render hands, wrists, arms, fingers/i);
assert.match(watchIsolationPrompt, /standalone watch product image/i);
assert.match(watchIsolationPrompt, /must never remain on a wrist/i);
assert.match(watchIsolationPrompt, /phone, camera, body, room, and selfie reflections/i);

const modelIsolationPrompt = buildProductOnlyIsolationPrompt({
  style: modelStyle,
  productType: "ساعت",
  visionAngle: "worn",
});
assert.equal(modelIsolationPrompt, "", "human/wearable style should not receive product-only isolation");

const sampleReferencePrompt = buildProductOnlyIsolationPrompt({
  style: sampleReferenceStyle,
  productType: "انگشتر",
  visionAngle: "worn",
});
assert.match(sampleReferencePrompt, /sample\/reference includes a hand, wrist, person/i);

assert.match(sampleReferenceSource, /product.*locked/i, "sample style should lock product identity");
assert.match(sampleReferenceSource, /Do not copy.*hand, wrist, fingers, skin/i, "sample style should reject sample human/product copying");
assert.match(sampleReferenceSource, /standalone premium product image/i, "sample style should stay product-only");
assert.match(sampleReferenceSource, /preserve product identity and reduce sample matching/i, "product identity should win over sample matching");
assert.doesNotMatch(sampleReferenceSource, /exactly where the sample product\/subject sits/i, "sample style must not force exact sample subject replacement");

console.log("Prompt policy checks passed.");
