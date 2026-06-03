export type OutputPresetId = "post" | "story" | "banner";

export type OutputPresetSpec = {
  id: OutputPresetId;
  providerSize: string;
  instruction: string;
};

const outputPresetSpecs: Record<OutputPresetId, OutputPresetSpec> = {
  post: {
    id: "post",
    providerSize: "1:1",
    instruction: "Output format: square product image for catalog and social post use. Prefer generous clean space around the product instead of defaulting to oversized close-up framing.",
  },
  story: {
    id: "story",
    providerSize: "9:16",
    instruction: "Output format: vertical 9:16 story image. Keep the product fully visible with useful top, bottom, and side margin; tighter detail framing is acceptable only when it fits the selected style.",
  },
  banner: {
    id: "banner",
    providerSize: "16:9",
    instruction: "Output format: horizontal 16:9 banner image. Keep the product prominent with refined negative space, and do not default to edge-to-edge close-up crop.",
  },
};

export function normalizeOutputPreset(value: FormDataEntryValue | string | null | undefined): OutputPresetId {
  if (value === "story" || value === "banner" || value === "post") {
    return value;
  }

  return "post";
}

export function getOutputPresetSpec(value: FormDataEntryValue | string | null | undefined): OutputPresetSpec {
  return outputPresetSpecs[normalizeOutputPreset(value)];
}
