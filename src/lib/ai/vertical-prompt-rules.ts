import {
  FOOD_PRODUCT_TYPE,
  FOOD_PRODUCT_TYPES,
  getDefaultProductType,
  normalizeProductType,
  type ProductType,
} from "@/lib/product-types";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

type StylePromptContext = {
  styleId: string;
  productType?: string | null;
  visionAngle?: string | null;
  productImageCount?: number;
  isHumanModelStyle?: boolean;
};

export const JEWELRY_SAMPLE_REFERENCE_BASE_PROMPT = [
  "Act as a senior jewelry retoucher doing scene-preserving product replacement.",
  "The uploaded product image or images are the only locked product identity source.",
  "Use the selected sample image as the target scene, composition, camera angle, lighting, mood, background, surface, props, water/fabric/material atmosphere, and non-product context only; it is not a product reference.",
  "Replace only the product/jewelry/accessory in the sample scene with the user's uploaded product, as if the original sample product was removed and the uploaded product was realistically placed there.",
  "Keep the sample scene recognizable, including hand, wrist, fingers, skin, body, pose, water, fabric, surface, reflections, shadows, props, crop, and lens feel when they are part of the sample composition.",
  "The user's uploaded product is locked: preserve its exact shape, stones, metal, engravings, proportions, silhouette, color, finish, gemstone layout, setting, and visible defects or details.",
  "Do not copy, mix in, or retain the sample product identity. Do not redesign, simplify, restyle, recolor, re-stone, unnaturally resize proportions, or invent a new product.",
].join(" ");

const FOOD_SAMPLE_REFERENCE_BASE_PROMPT = [
  "Act as a senior food and drink retoucher doing scene-preserving product replacement.",
  "The uploaded food, drink, dessert, cafe item, restaurant plate, or packaged product image or images define the core menu/product identity, not an exact jewelry-like geometry lock.",
  "Use the selected sample image as the target scene, composition, camera angle, lighting, mood, background, surface, props, table setting, freshness cues, and non-item context only; it is not an identity reference.",
  "Recognize and preserve the sample's photographic language when present: minimal white negative space, dark editorial contrast, art-photography geometry, hard graphic shadows, fine-dining restraint, fancy drink reflections, clean packaging angles, or simple catalog presentation.",
  "Replace the sample food, drink, plate, cup, package, or menu item in the sample scene with the uploaded item, allowing controlled advertising improvements to neatness, freshness, plating polish, garnish tidiness, sauce/cream/glaze clarity, condensation, plate/cup/package cleanliness, and surface styling.",
  "Keep the sample scene recognizable, including plate/table context, surface, props, glassware, napkins, condensation, steam only when believable, shadows, reflections, crop, lens feel, and appetite appeal when they are part of the sample composition.",
  "Preserve the uploaded item's core identity and recognizability: dish or drink type, cuisine/flavor family when visible, package shape, label placement, portion logic, key ingredients, texture family, serving vessel, and freshness cues.",
  "Do not copy, mix in, or retain the sample item identity. Do not change cuisine, flavor, brand, SKU, or turn the item into a different food, drink, dessert, package, or drastically different serving size.",
].join(" ");

const JEWELRY_GENERATION_PROMPT_SUFFIX = [
  "Return one final premium studio product image based on the input product photo.",
  "The input product is the strict identity reference. Preserve the exact product shape, proportions, silhouette, metal color, gemstone count and placement, visible chain or front-facing clasp design when naturally visible, watch face, engravings, material finish, and all visible jewelry details.",
  "Do not expose, invent, duplicate, or relocate hidden backs, rear clasps, closures, posts, undersides, or hardware just to show construction details.",
  "Do not redesign, simplify, add, remove, replace, resize, recolor, or hallucinate product parts.",
  "Do not default every output to a tight close-up. Prefer balanced studio framing with clean negative space around the product, while allowing closer detail framing when it clearly benefits the product or selected style.",
  "Make the image look like a real high-end studio photograph with natural optics, believable lighting, realistic reflections, and true material texture.",
  "Avoid AI-looking gloss, CGI, 3D render, plastic surfaces, over-smoothing, over-sharpening, artificial sparkle, surreal lighting, distorted geometry, and fake luxury effects.",
].join("\n");

const FOOD_GENERATION_PROMPT_SUFFIX = [
  "Return one final premium food or drink product image based on the input item photo.",
  "The input item defines the core menu/product identity, but Food may receive controlled advertising improvements. Preserve the dish, drink, dessert, cafe item, restaurant plate, or packaged item recognizability: item category, cuisine/flavor family when visible, package shape, label placement, portion logic, key ingredients, texture family, color family, serving vessel, and freshness cues.",
  "Plain white catalog override: if the selected style/control asks for a white, bright simple, or seamless clean background, keep the background empty, smooth, and texture-free with no tabletop, stone, ceramic, marble, wood, fabric, paper grain, props, stains, patterns, or wall/floor horizon. Use only a subtle realistic contact shadow.",
  "You may improve commercial appeal through cleaner plating, tidier garnish, more appetizing highlights, better sauce/cream/glaze definition, realistic condensation or steam only when plausible, cleaner plate/cup/package presentation, and more intentional surface styling.",
  "Do not turn the item into a different dish, drink, dessert, package, flavor, brand, serving size, cuisine, or menu item.",
  "Do not invent logos, fake brand text, unrelated labels, extra dishes, extra cups, people, hands, bitten leftovers, messy spills, or unsafe-looking food.",
  "Do not default every output to an extreme macro close-up. Prefer appetizing commercial framing with clean negative space and readable item detail, while allowing closer detail framing when it clearly benefits the selected style.",
  "Make the image look like a real premium food photograph with natural optics, believable lighting, realistic shadows, accurate color, and fresh edible texture.",
  "Avoid AI-looking gloss, CGI, plastic food, over-saturation, fake steam overload, melted or mushy textures, distorted packaging, unreadable fake labels, surreal lighting, and impossible plating.",
].join("\n");

const JEWELRY_REFERENCE_SCENE_PROMPT_SUFFIX = [
  "Return one final premium product image using the provided image order and labels.",
  "The primary product identity reference and any supporting product angles are the only product identity sources.",
  "The sample scene reference is scene and composition only, not product identity. Replace only the sample product/jewelry/accessory with the uploaded product.",
  "Preserve the exact uploaded product shape, proportions, silhouette, metal color, gemstone count and placement, visible chain or front-facing clasp design when naturally visible, watch face, engravings, setting, material finish, visible defects, and all visible jewelry details.",
  "Do not copy, mix in, retain, or reinterpret the sample product identity.",
  "Integrate the uploaded product realistically into the sample scene with believable perspective, scale, contact shadows, occlusion, reflections, lighting, depth of field, hand/finger wrapping, water distortion, and physical placement when present.",
  "Avoid AI-looking gloss, CGI, 3D render, plastic surfaces, over-smoothing, over-sharpening, artificial sparkle, surreal lighting, distorted geometry, and fake luxury effects.",
].join("\n");

const FOOD_REFERENCE_SCENE_PROMPT_SUFFIX = [
  "Return one final premium food or drink product image using the provided image order and labels.",
  "The primary item reference and any supporting item angles define the core food, drink, package, label, plating, and ingredient identity, with controlled advertising freedom for polish and appetite appeal.",
  "The sample scene reference is scene and composition only, not item identity. Replace only the sample food, drink, plate, cup, package, or menu item with the uploaded item.",
  "Preserve the uploaded item recognizability: dish or drink type, cuisine/flavor family when visible, portion logic, package shape, label placement, visible brand marks without inventing new text, key ingredients, texture family, color family, serving vessel, and freshness cues.",
  "Allow commercial improvements to plating neatness, garnish tidiness, sauce/cream/glaze clarity, freshness, condensation, plate/cup/package cleanliness, and surface styling when they keep the same menu item.",
  "Do not copy, mix in, retain, or reinterpret the sample item identity.",
  "Integrate the uploaded item realistically into the sample scene with believable perspective, scale, contact shadows, occlusion, reflections, lighting, depth of field, condensation, steam only when physically plausible, and plate/table interaction when present.",
  "Avoid AI-looking gloss, CGI, plastic food, over-saturation, fake steam overload, melted or mushy textures, distorted packaging, unreadable fake labels, surreal lighting, and impossible plating.",
].join("\n");

export function buildSampleReferenceBasePrompt(vertical: VerticalId) {
  return vertical === "food" ? FOOD_SAMPLE_REFERENCE_BASE_PROMPT : JEWELRY_SAMPLE_REFERENCE_BASE_PROMPT;
}

export function buildGenerationPromptSuffix(vertical: VerticalId = DEFAULT_VERTICAL_ID, hasReferenceScene = false) {
  if (vertical === "food") {
    return hasReferenceScene ? FOOD_REFERENCE_SCENE_PROMPT_SUFFIX : FOOD_GENERATION_PROMPT_SUFFIX;
  }

  return hasReferenceScene ? JEWELRY_REFERENCE_SCENE_PROMPT_SUFFIX : JEWELRY_GENERATION_PROMPT_SUFFIX;
}

export function buildVerticalFoundationPrompt(vertical: VerticalId, context: StylePromptContext) {
  if (vertical !== "food") {
    return "";
  }

  const productType = normalizeProductType(context.productType, vertical);

  return [
    "Ovala Food vertical rules:",
    `Treat the uploaded subject as a commercial food and drink item. User-confirmed item type: "${productType}".`,
    "Preserve appetite appeal while keeping the item honest, edible, and physically plausible.",
    "The input image remains the source of truth for core dish/drink/package identity, key ingredients, package shape, label placement, serving vessel, and portion logic.",
    "Food is allowed more advertising freedom than jewelry: improve freshness, neatness, plating polish, garnish tidiness, sauce/cream/glaze clarity, condensation, and surface styling when it makes the same menu item more sellable and does not conflict with the selected background control.",
    "Do not change the item into a different cuisine, flavor, brand, SKU, menu item, or drastically different serving size.",
  ].join("\n");
}

export function buildStyleCompositionPrompt(vertical: VerticalId, styleId: string) {
  if (vertical === "food") {
    if (styleId === "food_style_menu_catalog") {
      return [
        "Food menu/catalog composition: prioritize practical catalog readability over editorial styling.",
        "If the selected surface/background is white, bright simple, or seamless, create a plain empty white catalog image: no stone, ceramic, marble, wood, fabric, paper grain, visible tabletop, wall/floor horizon, props, stains, patterns, or decorative surface texture.",
        "The food, drink, cup, plate, package, or wrapper may cast a soft natural contact shadow, but the background itself must remain blank and clean.",
      ].join("\n");
    }

    if (styleId === "food_style_luxury") {
      return [
        "Food premium/editorial composition: treat the image like refined commercial food photography rather than a basic menu packshot.",
        "Depending on controls and item type, the style may lean dark editorial, minimal art photography, graphic shadow, fine dining, fancy drink/dessert, or premium packaging.",
        "Use deliberate negative space, controlled shadows, sculptural or polished surfaces, elegant reflections, quiet props only when useful, and premium contrast that keeps the item appetizing and physically believable.",
        "The food, drink, dessert, or package must remain recognizable as the same menu/product item; do not let art direction hide the serving vessel, label area, key ingredients, or texture family.",
      ].join("\n");
    }

    if (styleId !== "food_style_instagram_social") {
      return "";
    }

    return [
      "Food social composition: keep the hero item appetizing and readable without filling the entire frame.",
      "Reserve clean negative space for later Persian text or offer copy: place the food, drink, or package off-center on one side or lower corner, leaving the opposite side visually calm.",
      "Avoid giant edge-to-edge macro crops, messy table clutter, and plain centered packshot composition unless the selected sample/reference scene clearly requires it.",
    ].join("\n");
  }

  if (styleId !== "style_social_media") {
    return "";
  }

  return [
    "Social media composition: do not make the product a huge centered close-up. Keep it premium, readable, and intentionally smaller than a catalog hero shot.",
    "Always reserve text space for this social media style: the product should occupy roughly 18-30% of the frame, placed off-center on one side or lower corner, leaving the opposite side as clean designed negative space for text.",
    "Avoid filling most of the frame with the product, avoid edge-to-edge product crops, and avoid a plain centered packshot composition.",
  ].join("\n");
}

export function buildEditorialBackgroundDecorPrompt(vertical: VerticalId, styleId: string) {
  if (vertical !== "jewelry" || styleId !== "style_soft_editorial") {
    return "";
  }

  return "Editorial background decor: always include a restrained designed background decor element such as simple geometric volume, matte stone plane, soft fabric plane, plinth, or subtle editorial surface layering. Keep it premium, uncluttered, product-first, and avoid a plain empty catalog background.";
}

export function buildCompositionPrompt(vertical: VerticalId, context: StylePromptContext) {
  if (vertical === "food") {
    return [
      "Food composition: keep the item clearly readable, appetizing, and commercially useful.",
      "Show enough of the plate, glass, package, wrapper, label area, or serving vessel to understand the item identity and scale.",
      "For normal menu/catalog outputs, avoid extreme macro-only crops and avoid hiding important edges, labels, garnish, layers, or ingredient structure.",
      "Use clean negative space. Add supporting surface context only when it improves menu, delivery app, social, or website usability and does not conflict with a selected plain white or seamless background.",
    ].join("\n");
  }

  const isWatch = context.productType === "ساعت";
  const isWorn = context.visionAngle === "worn";
  const instructions = [
    "Composition: keep the product clearly readable but not oversized in frame.",
    "Do not default every result to a close-up. Vary the framing toward a slightly pulled-back premium product-photo composition where the full product has clean breathing room on every side.",
    "For normal catalog and studio outputs, the product should often occupy roughly one-quarter to two-fifths of the frame, while tighter close-up framing may be used only when it clearly serves detail, style, or reference direction.",
    "Avoid making most outputs extreme tight crops, edge-to-edge product crops, macro-only crops, or huge centered close-ups.",
  ];

  if (context.isHumanModelStyle && isWatch && isWorn) {
    instructions.push(
      "For a worn watch, keep a natural amount of wrist and skin visible, with enough surrounding context that the watch is not always an oversized crop while still remaining the obvious hero.",
    );
  }

  return instructions.join("\n");
}

export function buildFineDetailPrompt(vertical: VerticalId, context: StylePromptContext) {
  const productType = normalizeProductType(context.productType, vertical);

  if (vertical === "food") {
    return [
      buildFoodProductTypePrompt(productType),
      "Fine detail priority: preserve the recognizable food or drink identity, packaging and label placement, serving vessel, key ingredients, texture family, color family, and visible freshness cues.",
      "Controlled advertising polish is allowed: cleaner plating, tidier garnish, stronger appetizing highlights, clearer sauce/cream/glaze, realistic condensation, and neater package or cup presentation.",
      "Do not turn the item into a different dish, drink, dessert, package, flavor, brand, serving size, or cuisine. Keep ingredient details crisp and appetizing without making the result look synthetic.",
    ].join("\n");
  }

  if (productType === "ساعت") {
    return [
      "Fine detail priority: preserve the watch face layout, display structure, bezel markings, button placement, engravings, and case edges.",
      "Keep small functional details crisp and believable; do not blur, simplify, repaint, or replace them with generic shapes.",
    ].join("\n");
  }

  if (context.isHumanModelStyle && productType === "گردنبند") {
    return [
      "Fine detail priority for a necklace on a model: preserve pendant shape, visible chain links, metal tone, stone settings, engravings, and front-facing design cues.",
      "Default clasp policy: no visible clasp in necklace-on-model outputs. Treat any normal necklace clasp, lobster clasp, spring-ring clasp, hook, fastener, or rear closure as back-of-neck hardware that should not appear in the visible image.",
      "Do not expose, invent, duplicate, enlarge, or relocate a normal rear necklace clasp in the visible neck, collarbone, shoulder, pendant, or side-front area. Hidden back hardware should stay hidden when worn.",
    ].join("\n");
  }

  return [
    "Fine detail priority: preserve engravings, edges, stone settings, clasp details, and other small visible design cues.",
    "Do not blur, simplify, repaint, or replace small product details with generic shapes.",
  ].join("\n");
}

export function buildProductImageSetPrompt(vertical: VerticalId, context: StylePromptContext) {
  const productImageCount = context.productImageCount ?? 1;
  const productType = normalizeProductType(context.productType, vertical);

  if (productImageCount <= 1) {
    return "";
  }

  if (vertical === "food") {
    return [
      `Item identity references: use images 1-${productImageCount} together as views of the same food, drink, plate, or package.`,
      "Image 1 is the primary composition/source image. The additional images are supporting references for plating, packaging, label visibility, garnish, texture, scale, ingredient detail, and serving vessel only.",
      "Do not create multiple dishes, a collage, a menu spread, or multiple outputs. Return one final food/product image.",
    ].join("\n");
  }

  if (context.isHumanModelStyle && productType === "گردنبند") {
    return [
      `Product identity references: use images 1-${productImageCount} together as views of the same necklace.`,
      "Image 1 is the primary composition/source image. The additional product images are supporting detail and angle references only.",
      "Use the supporting images to preserve pendant design, visible chain shape, metal tone, stone layout, engravings, material finish, and front-facing necklace details.",
      "If a supporting image shows the rear clasp, use it only as hidden construction knowledge. Do not render that rear clasp in the worn model output; it should disappear naturally behind the neck.",
      "Do not create multiple products, a collage, or multiple outputs. Return one final product image.",
    ].join("\n");
  }

  return [
    `Product identity references: use images 1-${productImageCount} together as views of the same product.`,
    "Image 1 is the primary composition/source image. The additional product images are supporting detail and angle references only.",
    "Use the supporting images to preserve complicated details such as clasp structure, side profile, gemstone layout, engraving, watch face markings, chain shape, material finish, and hidden edges.",
    "Do not create multiple products, a collage, or multiple outputs. Return one final product image.",
  ].join("\n");
}

export function buildFinalHumanWearableCorrectionPrompt(vertical: VerticalId, context: StylePromptContext) {
  const productType = normalizeProductType(context.productType, vertical);

  if (vertical !== "jewelry" || !context.isHumanModelStyle || productType !== "گردنبند") {
    return "";
  }

  return [
    "Final necklace-on-model correction:",
    "Default policy: do not show a clasp in a necklace-on-model image. Assume any ordinary clasp or fastener in the source photo is a normal rear clasp unless it is unmistakably designed as a decorative front clasp.",
    "Ignore any earlier generic instruction to preserve or show clasp details when it conflicts with natural wearing. A natural worn necklace image does not need to show the rear clasp. Prefer a believable front or three-quarter model photo where the normal back clasp is completely hidden behind the neck.",
    "Never alter the pose, chain path, camera angle, crop, or product geometry to make a rear clasp visible. Do not place the clasp on the front of the neck, collarbone, shoulder, pendant area, or side-front chain.",
    "Negative constraint: no visible lobster clasp, spring-ring clasp, hook clasp, rear fastener, closure hardware, extra ring, or dangling clasp near the neck, collarbone, shoulder, pendant, or side-front chain.",
    "Only show a clasp if it is clearly a decorative front-facing clasp or front closure in the original product design; otherwise hide it naturally and preserve the pendant and visible chain instead.",
  ].join("\n");
}

export function buildVisionContextTruthSourcePrompt(vertical: VerticalId) {
  if (vertical === "food") {
    return "Use this only as supporting context. The input image remains the source of truth for core food/drink/package identity, portion logic, packaging, label placement, key ingredients, color family, texture family, and serving vessel; controlled advertising polish is allowed when it keeps the same menu/product item.";
  }

  return "Use this only as supporting context. The input image remains the source of truth for product identity, materials, color, stones, shape, engravings, and all visible details.";
}

export function buildVisionAnalysisPrompt(vertical: VerticalId) {
  if (vertical === "food") {
    return [
      "You are a vision assistant for Ovala Food, a Persian RTL food and drink product-photo app.",
      "Analyze the uploaded food, drink, dessert, cafe item, restaurant plate, or packaged product photo. The photo may be low quality, poorly lit, cropped, or have a busy background.",
      "Return ONLY valid JSON. Do not use markdown. Do not add explanations.",
      "Rules:",
      "- The project title must be in Persian.",
      "- The project title must be 2 to 5 words maximum.",
      "- Prefer specific menu/product names over generic names.",
      "- Include one clearly visible differentiator when possible: main ingredient, flavor, color, garnish, cup/package type, dish shape, or serving style.",
      "- Do not mention photography style in the title.",
      "- If unsure, choose a safe generic food type.",
      "- Do not invent brand names, labels, ingredients, flavors, or cuisines unless clearly visible.",
      "- If the image contains one packaged food or drink, use the packaged product type.",
      "- If the image contains a plated restaurant serving, use the restaurant plate type.",
      `Allowed product types: ${FOOD_PRODUCT_TYPES.join("، ")}`,
      "Return this exact JSON shape:",
      "{\"shortTitle\":\"string in Persian, 2-5 words\",\"productType\":\"one allowed Persian product type\",\"confidence\":0.0,\"internalDescription\":\"short English description of the visible food/drink/package only\",\"detectedAngle\":\"front | top | side | three-quarter | close-up | worn | unknown\",\"qualityIssues\":[\"low_light\",\"blur\",\"busy_background\",\"cropped\",\"reflection\",\"none\"]}",
    ].join("\n");
  }

  return [
    "You are a vision assistant for Ovala, a Persian RTL jewelry product-photo app.",
    "Analyze the uploaded product photo. The photo may be low quality, poorly lit, cropped, or have a busy background.",
    "Return ONLY valid JSON. Do not use markdown. Do not add explanations.",
    "Rules:",
    "- The project title must be in Persian.",
    "- The project title must be 2 to 5 words maximum.",
    "- Prefer specific product names over generic names.",
    "- Include one clearly visible differentiator when possible: shape, color, material, stone, motif, chain style, or set composition.",
    "- Do not mention photography style in the title.",
    "- If unsure, choose a safe generic product type.",
    "- Do not invent brand names, gemstones, or materials unless clearly visible.",
    "- If the image contains multiple coordinated product types, use productType \"ست\".",
    "- If the image contains multiple pieces of the same product type, use that product type, not \"ست\".",
    "Allowed product types: انگشتر، گردنبند، دستبند، گوشواره، ساعت، پابند، سنجاق، ست، اکسسوری، محصول",
    "Return this exact JSON shape:",
    "{\"shortTitle\":\"string in Persian, 2-5 words\",\"productType\":\"one allowed Persian product type\",\"confidence\":0.0,\"internalDescription\":\"short English description of the visible product only\",\"detectedAngle\":\"front | top | side | three-quarter | close-up | worn | unknown\",\"qualityIssues\":[\"low_light\",\"blur\",\"busy_background\",\"cropped\",\"reflection\",\"none\"]}",
  ].join("\n");
}

function buildFoodProductTypePrompt(productType: ProductType) {
  if (productType === FOOD_PRODUCT_TYPE.persianRice) {
    return "Persian rice dish refinement: preserve rice grain texture, saffron or topping placement, stew/khoresh separation when present, protein pieces, garnish, plate or container shape, and portion size. Keep colors appetizing and honest without changing the dish, cuisine, or serving style.";
  }

  if (productType === FOOD_PRODUCT_TYPE.grill) {
    return "Grill and kebab refinement: preserve skewer or grilled-piece geometry, char marks, doneness, meat texture, rice or bread relationship, onion/tomato/garnish placement, plate or takeaway container, and portion size. Do not rearrange it into another kebab, steak, or mixed platter.";
  }

  if (productType === FOOD_PRODUCT_TYPE.sandwich) {
    return "Burger, sandwich, and fried item refinement: preserve bun or bread shape, visible filling layers, cut-open interior when visible, fried coating texture, sauce placement, cheese, vegetables, wrapper or basket, and portion size. Do not change the sandwich build, filling, or protein type.";
  }

  if (productType === FOOD_PRODUCT_TYPE.pizzaFastFood) {
    return "Pizza and fast-food refinement: preserve crust shape, slice layout, toppings, cheese texture, sauce visibility, box or plate context, and portion. Keep the item readable for menu thumbnails without inventing toppings or changing the flavor.";
  }

  if (productType === FOOD_PRODUCT_TYPE.healthy) {
    return "Salad and healthy food refinement: preserve leaf freshness, ingredient separation, bowl or plate shape, dressing placement, grains, protein, fruit, vegetables, and portion. Keep colors bright but realistic, not over-saturated or plastic.";
  }

  if (productType === FOOD_PRODUCT_TYPE.cafeBreakfast) {
    return "Cafe breakfast refinement: preserve pastry, egg, toast, sandwich, saucer, cup, garnish, plate relationship, table scale, and serving identity. Keep the scene natural and clean without adding unrelated cafe clutter.";
  }

  if (productType === FOOD_PRODUCT_TYPE.hotDrink) {
    return "Hot drink refinement: preserve beverage color, foam, crema, latte art, steam only when subtle and plausible, cup shape, saucer, spoon, fill level, and any visible garnish. Do not change it into another coffee, tea, or hot beverage.";
  }

  if (productType === FOOD_PRODUCT_TYPE.coldDrink) {
    return "Cold drink refinement: preserve exact beverage color, opacity, ice, bubbles, layers, garnish, straw, cup/glass/can/bottle shape, condensation, and fill level. Do not change it into another drink or invent a brand.";
  }

  if (productType === FOOD_PRODUCT_TYPE.dessert) {
    return "Dessert refinement: preserve layers, filling, crumb or cream texture, topping placement, cut shape, glaze, fruit, chocolate, and serving size. Keep it fresh and structured, not melted, mushy, or over-decorated.";
  }

  if (productType === FOOD_PRODUCT_TYPE.bakery) {
    return "Bakery refinement: preserve crust, crumb, glaze, seeds, flour dusting, cut shape, pastry layers, box or tray context, and portion count. Keep texture crisp and fresh without turning it into a different pastry or bread.";
  }

  if (productType === FOOD_PRODUCT_TYPE.packaged) {
    return "Packaged food or drink refinement: preserve package shape, label area, visible brand marks, flavor cues, barcode/claims only when visible, cap/seal, wrapper folds, and product scale. Do not invent new label text, fake logos, or change the package into another SKU.";
  }

  if (productType === getDefaultProductType("food")) {
    return "General food and drink refinement: preserve the visible item category, ingredients, portion, packaging or serving vessel, texture, color, and presentation. If unsure, keep the source identity conservative rather than upgrading it into a different menu item.";
  }

  return "";
}
