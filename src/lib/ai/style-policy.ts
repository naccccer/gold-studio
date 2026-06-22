type StylePolicyStyle = {
  id?: string | null;
  controls?: Array<{ key: string }>;
};

const HUMAN_WEARABLE_STYLE_IDS = new Set(["style_with_model"]);
const HUMAN_WEARABLE_CONTROL_KEYS = new Set([
  "modelGender",
  "modelNationality",
  "faceFraming",
  "modelSceneStyle",
  "fullHijab",
  "modesty",
]);

export function isHumanWearableStyle(style: StylePolicyStyle) {
  if (style.id && HUMAN_WEARABLE_STYLE_IDS.has(style.id)) {
    return true;
  }

  return style.controls?.some((control) => HUMAN_WEARABLE_CONTROL_KEYS.has(control.key)) ?? false;
}

export function isProductOnlyStyle(style: StylePolicyStyle) {
  if (style.id === "style_sample_reference") {
    return false;
  }

  return !isHumanWearableStyle(style);
}

export function buildProductOnlyIsolationPrompt(input: {
  style: StylePolicyStyle;
  productType?: string | null;
  visionAngle?: string | null;
}) {
  if (!isProductOnlyStyle(input.style)) {
    return "";
  }

  const isWornSource = input.visionAngle === "worn";
  const isWatch = input.productType === "ساعت";
  const instructions = [
    "Strict product-only extraction mode:",
    "The input photo may show the product worn or held on a hand, wrist, finger, neck, ear, or body. Treat all human presence and lifestyle context as temporary source-photo context, not as part of the desired output.",
    "Remove and do not render hands, wrists, arms, fingers, nails, skin, faces, hair, bodies, people, mannequins, clothing, phone/camera objects, mirror-selfie artifacts, or distracting photographer reflections.",
    "Output a standalone premium product photograph or still-life of the product itself on the selected background, surface, or editorial set.",
    "Remove distracting phone, camera, body, room, and selfie reflections from reflective metal, gemstones, and watch glass while keeping clean physically plausible studio reflections.",
    "If a hand, finger, wrist, or body occludes part of the product, reconstruct the hidden portion conservatively from the product's visible geometry, symmetry, and supporting product images when available. Never invent new design elements, stones, logos, dial markings, links, clasps, crowns, bezels, engravings, or decorative hardware.",
    "Preserve the product identity while removing human context: keep the exact silhouette, proportions, metal color, material finish, stone count and placement, chain or strap structure, watch face, engravings, and visible craftsmanship.",
  ];

  if (isWornSource) {
    instructions.push(
      "The source image is a worn-product photo. Re-stage it as a standalone product shot, not as a wearable, body, wrist, hand, neck, ear, or lifestyle photo.",
    );
  }

  if (isWatch) {
    instructions.push(
      "For a watch source photo on a wrist or hand, create a standalone watch product image at a front or three-quarter product angle. Show the case, dial, bezel, crown/buttons, lugs, strap or bracelet, clasp area when naturally visible, and material finish as a physically plausible product object. The watch must never remain on a wrist for this product-only style.",
      "Keep the dial geometry, markers, hands, sub-dials, display layout, bezel markings, crown/button placement, strap links or band texture, and case edges crisp and believable.",
    );
  }

  return instructions.join("\n");
}
