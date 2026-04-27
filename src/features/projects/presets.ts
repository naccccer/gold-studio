export type StylePresetId = "CLEAN_WHITE" | "WARM_LUXURY" | "DRAMATIC_DARK" | "SOFT_EDITORIAL";

export const STYLE_PRESETS: Array<{
  id: StylePresetId;
  label: string;
  description: string;
  prompt: string;
}> = [
  {
    id: "CLEAN_WHITE",
    label: "سفید مینیمال",
    description: "پس‌زمینه سفید و نور یکدست فروشگاهی",
    prompt:
      "Create a clean premium e-commerce product image with pure white background, balanced soft lighting and realistic metallic detail.",
  },
  {
    id: "WARM_LUXURY",
    label: "لوکس گرم",
    description: "نور گرم و حس لوکس برای طلا و جواهر",
    prompt:
      "Create a premium warm-luxury studio image with golden tones, gentle shadows, elegant reflection and high-fidelity jewelry detail.",
  },
  {
    id: "DRAMATIC_DARK",
    label: "تیره دراماتیک",
    description: "کنتراست بالا و پس‌زمینه تیره",
    prompt:
      "Create a dramatic dark-background product shot with high contrast, controlled highlights and premium cinematic style.",
  },
  {
    id: "SOFT_EDITORIAL",
    label: "ادیتوریال نرم",
    description: "ظاهر نرم و مجله‌ای با بافت طبیعی",
    prompt:
      "Create a soft editorial style image with gentle light gradients, natural texture, realistic product shape and premium magazine feeling.",
  },
];

export function getStylePreset(preset: string) {
  return STYLE_PRESETS.find((item) => item.id === preset);
}
