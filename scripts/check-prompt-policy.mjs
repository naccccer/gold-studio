import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/ai/style-policy.ts", import.meta.url), "utf8");
const generationPromptSource = await readFile(new URL("../src/lib/ai/generation-prompt.ts", import.meta.url), "utf8");
const verticalPromptRulesSource = await readFile(new URL("../src/lib/ai/vertical-prompt-rules.ts", import.meta.url), "utf8");
const sampleReferenceSource = await readFile(new URL("../src/lib/style-reference-vision.ts", import.meta.url), "utf8");
const avalaiSource = await readFile(new URL("../src/lib/ai/avalai.ts", import.meta.url), "utf8");
const liaraSource = await readFile(new URL("../src/lib/ai/liara.ts", import.meta.url), "utf8");
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
assert.equal(isProductOnlyStyle(sampleReferenceStyle), false, "sample reference should preserve the sample scene instead of product-only extraction");
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
assert.equal(sampleReferencePrompt, "", "sample reference should not receive product-only isolation");

const promptArchitectureSource = [generationPromptSource, verticalPromptRulesSource].join("\n");
const samplePolicySource = [generationPromptSource, verticalPromptRulesSource, sampleReferenceSource, avalaiSource, liaraSource].join("\n");

assert.match(promptArchitectureSource, /Final necklace-on-model correction/i, "necklace model prompts should end with a final clasp correction");
assert.match(promptArchitectureSource, /Default policy: do not show a clasp in a necklace-on-model image/i, "necklace model prompts should default to no visible clasp");
assert.match(promptArchitectureSource, /Ignore any earlier generic instruction to preserve or show clasp details/i, "necklace model prompts should override generic clasp preservation");
assert.match(promptArchitectureSource, /normal back clasp is completely hidden behind the neck/i, "necklace model prompts should allow hidden rear clasps");
assert.match(promptArchitectureSource, /Never alter the pose, chain path, camera angle, crop, or product geometry to make a rear clasp visible/i, "necklace model prompts should forbid unnatural clasp exposure");
assert.match(promptArchitectureSource, /no visible lobster clasp, spring-ring clasp, hook clasp, rear fastener/i, "necklace model prompts should explicitly ban visible normal clasp hardware");
assert.match(promptArchitectureSource, /Do not render that rear clasp in the worn model output/i, "necklace supporting images should not force rear clasp visibility");
assert.match(promptArchitectureSource, /decorative front-facing clasp or front closure/i, "necklace model prompts should allow only true front clasps");

assert.match(promptArchitectureSource, /Ovala Food vertical rules/i, "Food prompts should have a dedicated vertical rule block");
assert.match(promptArchitectureSource, /Preserve appetite appeal/i, "Food prompts should optimize for appetite appeal");
assert.match(promptArchitectureSource, /plating, packaging, label placement, garnish, sauce pattern/i, "Food prompts should preserve plating, packaging, labels, garnish, and sauces");
assert.match(promptArchitectureSource, /Do not turn the item into a different dish, drink, dessert, package, flavor, brand, serving size, or cuisine/i, "Food prompts should forbid identity drift");
assert.match(promptArchitectureSource, /Packaged food or drink refinement/i, "Food prompts should include packaged item refinements");
assert.match(promptArchitectureSource, /Drink refinement/i, "Food prompts should include drink refinements");
assert.match(promptArchitectureSource, /Restaurant plate refinement/i, "Food prompts should include restaurant plate refinements");
assert.match(samplePolicySource, /food item replacement mode/i, "Food sample-reference prompts should replace food items, not jewelry");
assert.match(samplePolicySource, /Do not invent new label text, fake logos/i, "Food prompts should protect labels and brands");
assert.match(samplePolicySource, /food or drink product image/i, "Provider suffixes should include Food-specific image instructions");

assert.match(samplePolicySource, /only locked product identity source/i, "sample style should lock uploaded product identity");
assert.match(samplePolicySource, /only product identity source/i, "sample style should treat uploaded images as the only product identity source");
assert.match(samplePolicySource, /not a product reference/i, "sample image should not be treated as a product reference");
assert.match(samplePolicySource, /target scene and composition/i, "sample style should preserve the sample scene");
assert.match(samplePolicySource, /Keep its non-product scene recognizable/i, "sample style should keep hands/body/water context when present");
assert.match(samplePolicySource, /Replace only the product\/jewelry\/accessory/i, "sample style should replace only the sample product");
assert.match(samplePolicySource, /Do not copy[\s\S]*sample product identity/i, "sample style should forbid copying the sample product identity");
assert.match(samplePolicySource, /contact shadows/i, "sample style should require contact shadows for realistic placement");
assert.match(samplePolicySource, /occlusion/i, "sample style should require occlusion for realistic placement");
assert.match(samplePolicySource, /depth of field/i, "sample style should require depth of field integration");
assert.match(samplePolicySource, /hand\/finger wrapping/i, "sample style should require hand/finger wrapping when present");
assert.match(samplePolicySource, /water distortion/i, "sample style should require water distortion when present");
assert.doesNotMatch(sampleReferenceSource, /exactly where the sample product\/subject sits/i, "sample style must not force exact sample subject replacement");
assert.doesNotMatch(sampleReferenceSource, /standalone premium product image/i, "sample style must not force standalone product-only output");

function assertOrder(sourceText, needles, message) {
  const positions = needles.map((needle) => sourceText.indexOf(needle));
  for (const [index, position] of positions.entries()) {
    assert.notEqual(position, -1, `${message}: missing ${needles[index]}`);
  }
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], message);
  }
}

assertOrder(
  avalaiSource,
  [
    "Primary product identity reference",
    "Supporting product identity angle",
    "Sample scene reference",
  ],
  "Avalai chat content should label uploaded product first, supporting product images second, and sample scene last",
);
assertOrder(
  avalaiSource,
  [
    "`source.${extensionFromMimeType(mimeType)}`",
    "`supporting-${index + 1}.${extensionFromMimeType(supportingImage.mimeType)}`",
    "`reference.${extensionFromMimeType(safeReferenceMimeType)}`",
  ],
  "Avalai multipart image order should be source, supporting products, then sample reference",
);
assertOrder(
  liaraSource,
  [
    "`source.${extensionFromMimeType(sourceImage.mimeType)}`",
    "`supporting-${index + 1}.${extensionFromMimeType(preparedSupportingImage.mimeType)}`",
    "`reference.${extensionFromMimeType(referenceImage.mimeType)}`",
  ],
  "Liara multipart image order should be source, supporting products, then sample reference",
);
assert.match(avalaiSource, /generationPromptSuffix\(vertical, Boolean\(referenceBuffer\)\)/, "Avalai should use the vertical-aware reference-scene suffix when a sample scene is present");
assert.match(liaraSource, /generationPromptSuffix\(vertical, Boolean\(referenceImage\)\)/, "Liara should use the vertical-aware reference-scene suffix when a sample scene is present");

console.log("Prompt policy checks passed.");
