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
    woman: "Use an elegant adult woman model, generally 25 to 35 years old, when a human model is needed.",
    man: "Use an elegant adult man model, generally 25 to 35 years old, when a human model is needed.",
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
    surfaceReflection: [
      "Use a subtle realistic surface reflection under the product.",
      "Avoid mirror-like surface reflections; keep the surface clean and matte.",
    ],
    textSpace: [
      "Leave clean negative space suitable for adding short social media text later.",
      "No extra reserved text area is needed; prioritize product-filled composition.",
    ],
    darkBackground: [
      "Use a deep elegant dark background while preserving readable product detail.",
      "Keep the background cinematic but not fully dark; preserve softer tonal separation.",
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
    visualEnergy: `Visual energy: ${level}; make it commercially attractive without over-saturation or clutter.`,
    depthOfField: `Depth of field: ${level}; keep product details crisp and do not hide craftsmanship in blur.`,
    contrastIntensity: `Contrast intensity: ${level}; avoid crushed blacks and keep details readable.`,
  };

  return map[key] ?? `${key}: ${level}.`;
}

export function buildStyleControlPrompt(style: { controls?: StyleControl[] }, formData: FormData) {
  const instructions: string[] = [];

  for (const control of style.controls ?? []) {
    const value = String(formData.get(`styleControl_${control.key}`) ?? control.defaultValue ?? "").trim();

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
      instructions.push(booleanInstruction(control.key, value === "true" || value === "on" || value === "1"));
    }
  }

  return instructions.join("\n");
}

export function hasHumanModelStyleControls(style: { controls?: StyleControl[] }) {
  return style.controls?.some((control) => control.key === "modelGender" || control.key === "modesty") ?? false;
}
