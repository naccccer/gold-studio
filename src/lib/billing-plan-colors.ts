export const BILLING_PLAN_COLOR_PRESETS = [
  { id: "amber", label: "کهربایی", swatch: "#9b7040" },
  { id: "rose", label: "رز", swatch: "#9b5b65" },
  { id: "emerald", label: "زمردی", swatch: "#2f705f" },
  { id: "sapphire", label: "یاقوت آبی", swatch: "#375f92" },
  { id: "plum", label: "آلویی", swatch: "#674574" },
  { id: "graphite", label: "گرافیتی", swatch: "#3d3933" },
  { id: "bronze", label: "برنزی", swatch: "#8a5a33" },
  { id: "teal", label: "تیل", swatch: "#287070" },
  { id: "ruby", label: "یاقوتی", swatch: "#873d45" },
  { id: "ivory", label: "عاجی", swatch: "#d6bf91" },
] as const;

export type BillingPlanColorPreset = (typeof BILLING_PLAN_COLOR_PRESETS)[number]["id"];

export function normalizeBillingPlanColorPreset(value: string | null | undefined): BillingPlanColorPreset {
  return BILLING_PLAN_COLOR_PRESETS.some((preset) => preset.id === value) ? (value as BillingPlanColorPreset) : "amber";
}
