export const DEFAULT_PRODUCT_TYPE = "محصول";

export const PRODUCT_TYPES = ["انگشتر", "گردنبند", "دستبند", "گوشواره", "ساعت", "پابند", "سنجاق", "ست", "اکسسوری", DEFAULT_PRODUCT_TYPE] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export function isProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

export function normalizeProductType(value: unknown): ProductType {
  const text = typeof value === "string" ? value.trim() : "";
  return isProductType(text) ? text : DEFAULT_PRODUCT_TYPE;
}

export function productTypeLabel(value: ProductType) {
  return value === DEFAULT_PRODUCT_TYPE ? "سایر" : value;
}
