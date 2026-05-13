export const PRODUCT_TYPES = ["انگشتر", "گردنبند", "دستبند", "گوشواره", "ساعت", "پابند", "سنجاق", "ست", "اکسسوری", "محصول"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export function isProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

export function normalizeProductType(value: unknown): ProductType {
  const text = typeof value === "string" ? value.trim() : "";
  return isProductType(text) ? text : "محصول";
}
