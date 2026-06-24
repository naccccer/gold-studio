type StyleControl = {
  key: string;
  label: string;
  type: "CHOICE" | "RANGE" | "BOOLEAN";
  optionsJson?: string | null;
  defaultValue?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
};

type StyleControlOption = {
  value: string;
  label: string;
};

const controlInstructions: Record<string, Record<string, string>> = {
  modelGender: {
    woman: "Use an elegant adult woman model, generally 25 to 35 years old, when a human model is needed. If hands or wrists are visible, they must look like professional jewelry hand-model hands: slender natural fingers, graceful relaxed pose, neat natural nails, clean cuticles, refined feminine proportions, realistic skin texture, and no rough, swollen, masculine, aged, dry, cracked, or work-worn hands.",
    man: "Use an elegant adult man model, generally 25 to 35 years old, when a human model is needed.",
  },
  modelNationality: {
    iranian: "Model casting: use a natural contemporary Iranian-looking model with Middle Eastern features, without ethnic exaggeration, costume styling, or stereotypes.",
    middleEastern: "Model casting: use a natural contemporary Middle Eastern-looking model with regionally plausible features and skin tone variation, without stereotypes or costume styling.",
    european: "Model casting: use a natural contemporary European-looking model only because this option was selected; keep the styling product-first and realistic.",
  },
  faceFraming: {
    productArea: "Face framing: prioritize the product area rather than a full face. For necklaces show the neck, collarbone, and possibly the lower face; for earrings show the ear and partial profile; for rings, bracelets, and watches focus on hands or wrists. Do not force a full-face portrait.",
    partialFace: "Face framing: a partial face or cropped portrait is allowed when it supports the product, but the jewelry remains the clear hero and the face must not dominate.",
    fullFace: "Face framing: a full-face portrait is allowed, but the jewelry or accessory must still be the commercial hero with readable product detail.",
  },
  modelSceneStyle: {
    amateurHome: "Model scene style: create an authentic amateur mobile-photo / UGC-style image in a real home-like setting, with casual natural light, handheld phone-camera feel, and less polished production. Keep it usable for selling: the space should be tidy, the clothing clean, and the product readable. Avoid pajamas, sloppy loungewear, messy rooms, beds, laundry, clutter, low-quality dark lighting, or awkward domestic distractions.",
    studio: "Model scene style: use a clean studio or controlled indoor setup with refined styling, neat modern wardrobe, flattering soft light, and a premium product-photo feel.",
    outdoor: "Model scene style: use a controlled outdoor setting with clean natural light, quiet background, tasteful modern wardrobe, and no crowding, street clutter, harsh sun, or distractions from the product.",
  },
  decorSurface: {
    stone: "Decor surface: use a restrained matte stone or marble-like surface.",
    geometric: "Decor surface: use simple geometric blocks and clean sculptural planes.",
    silk: "Decor surface: use a matte fabric surface with subtle folds, without perfume or fragrance styling.",
  },
  backgroundType: {
    simple: "Background type: use a perfectly smooth, flat, seamless studio background with no visible texture, folds, waves, props, or decorative surface.",
    fabric: "Background type: use a flat fabric-inspired matte background only as a subtle material feel; avoid visible folds, drape waves, wrinkles, cushions, or cloth styling.",
    leather: "Background type: use a flat fine-grain leather-inspired background; keep the surface smooth, even, and free of creases, seams, props, or luxury still-life styling.",
    stone: "Background type: use a flat matte stone-inspired background with very subtle tone variation; avoid slabs, veining patterns, props, steps, or visible texture competing with the product.",
    paper: "Background type: use smooth premium paper or cardstock as a flat seamless studio background; avoid curled paper, folds, edges, or layered surfaces.",
  },
  backgroundColor: {
    white: "Background color: clean soft white.",
    cream: "Background color: pale champagne cream, subtle and premium.",
    lightGray: "Background color: very light neutral gray.",
    blush: "Background color: very pale blush nude, elegant and low saturation.",
    navy: "Background color: deep refined navy blue; keep lighting clean and product details readable.",
    charcoal: "Background color: deep charcoal only when it improves contrast; keep product details readable.",
    softBlack: "Background color: soft near-black, not crushed; keep product edges and gold detail readable.",
    forest: "Background color: deep muted forest green; premium, restrained, and not saturated.",
    burgundy: "Background color: deep muted burgundy; elegant, low saturation, and product-first.",
    espresso: "Background color: very dark espresso brown; keep it refined and not orange-heavy.",
  },
  editorialMood: {
    calm: "Editorial mood: calm, quiet, refined magazine styling.",
    luxury: "Editorial mood: more luxurious and polished, while staying understated.",
    bold: "Editorial mood: slightly bolder composition with confident magazine energy, still product-first.",
  },
  socialBackgroundTone: {
    light: "Social background tone: use a light tonal editorial background such as champagne, blush nude, pale sage, ivory-warm neutral, or soft light gray. It must feel designed and premium, not plain white catalog.",
    dark: "Social background tone: use a dark tonal editorial background such as deep navy, charcoal, burgundy, forest green, or espresso. Keep jewelry detail readable with controlled highlights and refined contrast.",
  },
  socialTextPlacement: {
    right: "Social text placement: reserve the right side of the image as clean readable negative space for Persian text; place the product on the left side or lower-left area.",
    left: "Social text placement: reserve the left side of the image as clean readable negative space for text; place the product on the right side or lower-right area.",
    top: "Social text placement: reserve the upper area of the image as clean readable negative space for text; place the product lower in the frame.",
    bottom: "Social text placement: reserve the lower area of the image as clean readable negative space for text; place the product higher in the frame.",
  },
  foodMenuAngle: {
    auto: "Food menu angle: choose the most commercially readable angle for the uploaded item, usually top-down for bowls, plates, pizza, and trays, 45-degree for burgers, sandwiches, desserts, and cafe items, and front/three-quarter for bottles, cups, and packages.",
    top: "Food menu angle: use a clean top-down or near top-down menu/catalog view with the item fully readable in a square thumbnail.",
    threeQuarter: "Food menu angle: use a controlled 45-degree commercial food angle that shows height, layers, texture, and serving vessel clearly.",
    front: "Food menu angle: use a front or slight three-quarter product angle for cups, bottles, packages, tall desserts, sandwiches, or layered items where height matters.",
  },
  foodMenuSurface: {
    white: "Food menu and clean-background surface: use a clean soft-white or very light neutral background for consistent delivery-app catalog thumbnails.",
    stone: "Food menu and clean-background surface: use a light matte stone or ceramic surface with subtle texture, keeping the item crisp and menu-ready.",
    wood: "Food menu and clean-background surface: use a clean pale wood or warm restaurant tabletop surface, restrained and not rustic clutter.",
    dark: "Food menu and clean-background surface: use a refined dark matte surface only when it improves contrast; keep food color and edges readable.",
  },
  foodBackgroundSurface: {
    seamless: "Food clean background surface: use a seamless smooth studio background with no props, horizon line, folds, stains, or visual clutter.",
    stone: "Food clean background surface: use a light matte stone or ceramic surface with subtle believable contact shadows.",
    wood: "Food clean background surface: use a clean pale wood surface suitable for cafe and restaurant menu imagery.",
    counter: "Food clean background surface: use a clean stainless, counter, or matte prep-surface feel without kitchen mess.",
  },
  foodBackgroundTone: {
    white: "Food background tone: clean soft white for maximum menu readability.",
    lightGray: "Food background tone: very light neutral gray, clean and modern.",
    warm: "Food background tone: subtle warm off-white or pale natural surface; avoid beige-heavy or dull colors.",
    dark: "Food background tone: controlled dark neutral with readable edges and appetizing food color.",
  },
  foodSampleMatch: {
    strict: "Food sample-photo matching: follow the selected sample scene closely for angle, crop, lighting, surface, and mood while replacing only the sample item with the uploaded item identity.",
    balanced: "Food sample-photo matching: use the sample as a strong direction for lighting, surface, camera angle, and mood, but adapt crop and scale where needed to keep the uploaded item appetizing and readable.",
    flexible: "Food sample-photo matching: borrow the sample's general mood and surface language, but prioritize the uploaded item's best commercial presentation and menu readability.",
  },
  foodSampleCrop: {
    preserve: "Food sample crop: preserve the sample image crop and framing as much as possible.",
    square: "Food sample crop: adapt the composition so the final image works well as a square menu or Instagram post thumbnail.",
    close: "Food sample crop: allow a slightly closer crop to emphasize texture, layers, garnish, condensation, or package detail while keeping item identity complete.",
  },
  foodServingVessel: {
    auto: "Serving vessel: preserve and improve the uploaded item's actual plate, bowl, cup, glass, wrapper, tray, box, or container, choosing the most believable serving presentation from the source.",
    plate: "Serving vessel: emphasize a clean plate presentation, preserving plate rim, shape, scale, plating geometry, garnish, and contact shadows.",
    bowl: "Serving vessel: emphasize a bowl or deep-dish presentation, preserving rim shape, depth, ingredient visibility, sauce/stew level, and portion scale.",
    cupGlass: "Serving vessel: emphasize the cup, glass, mug, or bottle presentation, preserving shape, fill level, foam, ice, condensation, straw, garnish, and rim detail.",
    takeaway: "Serving vessel: emphasize takeaway or delivery packaging such as box, wrapper, tray, cup, lid, or container, while keeping it clean and sales-ready.",
  },
  foodSocialTextPlacement: {
    right: "Food social text placement: reserve clean negative space on the right side for later Persian text, price, offer, or sticker; place the food, drink, or package toward the left or lower-left.",
    left: "Food social text placement: reserve clean negative space on the left side for later text; place the item toward the right or lower-right.",
    top: "Food social text placement: reserve the upper area for later text; keep the item lower in frame with appetizing detail still readable.",
    bottom: "Food social text placement: reserve the lower area for later text; keep the item higher in frame with clean visual breathing room.",
  },
  foodSocialMood: {
    fresh: "Food social mood: bright, fresh, appetizing, modern, and clean, suitable for daily Instagram posts.",
    offer: "Food social mood: energetic sales-campaign composition suitable for discount, launch, or limited-time offer graphics, with clear empty space for copy.",
    premium: "Food social mood: more premium, editorial, and restrained, with refined light and richer but realistic contrast.",
    cozy: "Food social mood: warm cafe or restaurant feeling, natural and inviting without clutter or low-light dullness.",
  },
  foodSceneContext: {
    cafeTable: "Food scene context: use a clean cafe table setting with restrained surface details, cup, napkin, saucer, or pastry context only when helpful.",
    restaurantTable: "Food scene context: use a polished restaurant table setting with quiet plate, cutlery, glassware, or napkin context, never crowded.",
    counter: "Food scene context: use a clean counter or preparation surface feel, commercial and tidy, without kitchen mess.",
    takeaway: "Food scene context: use a clean takeaway pickup or delivery-ready context with package, wrapper, box, or bag cues only when they fit the uploaded item.",
  },
  foodPackageAngle: {
    front: "Packaged item angle: use a straight-on or near straight-on angle that makes the front label area and package silhouette clear.",
    threeQuarter: "Packaged item angle: use a premium three-quarter product angle showing package depth, cap, side folds, cup shape, bottle shape, or box structure.",
    top: "Packaged item angle: use a top-down layout for flat boxes, trays, wrappers, or grouped takeaway packaging when it improves catalog readability.",
    hero: "Packaged item angle: use a stronger hero product angle for Instagram and catalog use, with clean negative space and realistic reflections.",
  },
};

function parseOptions(optionsJson?: string | null): StyleControlOption[] {
  if (!optionsJson) return [];

  try {
    const parsed = JSON.parse(optionsJson) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const option = item as Partial<StyleControlOption>;
        if (!option.value || !option.label) return null;
        return { value: String(option.value), label: String(option.label) };
      })
      .filter((item): item is StyleControlOption => Boolean(item));
  } catch {
    return [];
  }
}

function clampRange(value: string | null, control: StyleControl) {
  const fallback = Number.parseInt(control.defaultValue ?? "50", 10);
  const parsed = Number.parseInt(value ?? "", 10);
  const min = control.minValue ?? 0;
  const max = control.maxValue ?? 100;
  const safeValue = Number.isFinite(parsed) ? parsed : fallback;

  return Math.min(max, Math.max(min, safeValue));
}

function rangeLevel(value: number) {
  if (value <= 25) return "low";
  if (value <= 60) return "moderate";
  return "high";
}

function getModestyInstruction(value: number) {
  if (value <= 0) {
    return "Modesty styling: no hijab or religious head covering is required. Keep the image elegant, tasteful, non-sexual, adult, and product-first.";
  }

  if (value <= 30) {
    return "Modesty styling: low coverage preference. No hijab requirement; use refined contemporary styling, tasteful wardrobe, and no sexualized posing.";
  }

  if (value <= 65) {
    return "Modesty styling: moderate coverage preference. Use elegant covered styling or a light head covering only if it fits the composition naturally.";
  }

  return "Modesty styling: high coverage preference. Use conservative elegant wardrobe, covered hair when appropriate, and refined fashion-editorial styling without costume-like exaggeration.";
}

function booleanInstruction(key: string, enabled: boolean) {
  const map: Record<string, [string, string]> = {
    fullHijab: [
      "Full hijab styling: for a woman model, use full elegant hijab and refined modest fashion styling. Keep it contemporary, natural, non-costume, non-stereotyped, and product-first.",
      "",
    ],
    surfaceReflection: [
      "Use a subtle realistic surface reflection under the product.",
      "Avoid mirror-like surface reflections; keep the surface clean and matte.",
    ],
    textSpace: [
      "Leave clean negative space suitable for adding short social media text later: place the product clearly off-center toward one side or lower corner, keep it modest in scale rather than a large centered close-up, and leave the opposite side open and uncluttered as a readable text area. Keep the scene visually designed with a tonal editorial background rather than a plain white catalog backdrop.",
      "No extra reserved text area is needed; prioritize product-filled composition.",
    ],
    darkBackground: [
      "Use a deep elegant dark background while preserving readable product detail.",
      "Keep the background cinematic but not fully dark; preserve softer tonal separation.",
    ],
    foodLabelPriority: [
      "Packaging label priority: keep the visible source label area, logo marks, flavor cues, cap, seal, wrapper folds, and package front as clear and undistorted as possible. Do not invent new text, claims, or fake branding.",
      "Packaging label priority is relaxed: preserve package identity and visible brand marks, but prioritize overall appetizing commercial presentation.",
    ],
  };

  return (map[key] ?? [`${key}: enabled.`, `${key}: disabled.`])[enabled ? 0 : 1];
}

function rangeInstruction(key: string, value: number) {
  if (key === "modesty") return getModestyInstruction(value);

  const level = rangeLevel(value);
  const map: Record<string, string> = {
    softShadow: `Soft shadow strength: ${level}; keep shadows natural and catalog-clean.`,
    decorIntensity: `Decor intensity: ${level}; keep decorative elements secondary to the product.`,
    visualEnergy: `Visual energy: ${level}; make it commercially attractive with social-campaign styling, tonal color, and controlled contrast, without over-saturation, clutter, or plain white catalog staging.`,
    depthOfField: `Depth of field: ${level}; keep product details crisp and do not hide craftsmanship in blur.`,
    contrastIntensity: `Contrast intensity: ${level}; avoid crushed blacks and keep details readable.`,
    foodShadowStrength: `Food shadow strength: ${level}; keep contact shadows realistic, clean, and suitable for menu/catalog use.`,
    foodPropLevel: `Food prop level: ${level}; use props only when they clarify restaurant/cafe context and never let them compete with the item.`,
    foodFreshness: `Freshness emphasis: ${level}; gently improve freshness, color, steam/condensation only when physically plausible, and texture without making the food look fake or over-processed.`,
    foodVesselFocus: `Serving vessel focus: ${level}; keep the food or drink as the hero while making the plate, bowl, cup, glass, wrapper, box, or container cleaner, more intentional, and commercially presentable.`,
  };

  return map[key] ?? `${key}: ${level}.`;
}

export function buildStyleControlPrompt(style: { controls?: StyleControl[] }, formData: FormData) {
  const instructions: string[] = [];
  const modelGender = String(formData.get("styleControl_modelGender") ?? "woman").trim();

  for (const control of style.controls ?? []) {
    const value = String(formData.get(`styleControl_${control.key}`) ?? control.defaultValue ?? "").trim();

    if (control.key === "fullHijab" && modelGender !== "woman") {
      continue;
    }

    if (control.type === "CHOICE") {
      const options = parseOptions(control.optionsJson);
      const selected = options.find((option) => option.value === value);
      const instruction = controlInstructions[control.key]?.[value];

      if (instruction) {
        instructions.push(instruction);
      } else if (selected) {
        instructions.push(`${control.label}: ${selected.label}.`);
      }
    }

    if (control.type === "RANGE") {
      instructions.push(rangeInstruction(control.key, clampRange(value, control)));
    }

    if (control.type === "BOOLEAN") {
      const instruction = booleanInstruction(control.key, value === "true" || value === "on" || value === "1");
      if (instruction) {
        instructions.push(instruction);
      }
    }
  }

  return instructions.join("\n");
}

export function buildHumanModelProductWearPrompt(productType?: string | null) {
  const base = [
    "Worn product realism: when jewelry or accessories are shown on a human body, prioritize physically plausible wearing over exposing every construction detail.",
    "Do not twist the body, rotate the product, duplicate parts, or use impossible angles just to reveal clasps, backs, closures, or hidden hardware.",
  ];

  if (productType === "گردنبند") {
    base.push(
      "Default necklace-on-model clasp policy: no visible clasp. For a necklace worn on the neck, treat ordinary clasps, lobster clasps, spring-ring clasps, hooks, fasteners, and back closures as hidden hardware behind the neck.",
      "In a natural front or three-quarter worn necklace photo, the rear clasp should be fully invisible unless the product unmistakably has a decorative front clasp or front closure.",
      "It is correct and preferred for a normal rear clasp to be absent from the visible image. Do not move, duplicate, enlarge, rotate, or expose a normal rear clasp on the front, side-front, collarbone, pendant area, shoulder, or visible chain just to prove it exists.",
      "If the source photo shows a back clasp, preserve it as product identity knowledge but let it disappear naturally behind the model's neck in the worn photo.",
      "Keep the chain naturally resting around the neck and collarbone; preserve the pendant, visible chain shape, metal tone, and front-facing design details.",
    );
  } else if (productType === "گوشواره") {
    base.push("For earrings, do not force the backing or post behind the ear into view unless it is naturally visible from the selected angle.");
  } else if (productType === "دستبند" || productType === "ساعت") {
    base.push("For bracelets and watches, show the clasp only if it naturally falls on the visible side of the wrist; do not use an awkward wrist twist just to reveal it.");
  } else if (productType === "انگشتر") {
    base.push("For rings, do not force hidden underside or back-of-band details into view while worn; keep the natural top and side view readable.");
  } else {
    base.push("If body, hair, ear, neck, or hand naturally hides a small hardware detail, let it be hidden rather than creating an unnatural product display.");
  }

  return base.join("\n");
}
