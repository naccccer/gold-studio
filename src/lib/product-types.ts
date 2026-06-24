import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

export const JEWELRY_DEFAULT_PRODUCT_TYPE = "محصول";
export const FOOD_DEFAULT_PRODUCT_TYPE = "غذا یا نوشیدنی";
export const DEFAULT_PRODUCT_TYPE = JEWELRY_DEFAULT_PRODUCT_TYPE;

export const JEWELRY_PRODUCT_TYPES = [
  "انگشتر",
  "گردنبند",
  "دستبند",
  "گوشواره",
  "ساعت",
  "پابند",
  "سنجاق",
  "ست",
  "اکسسوری",
  JEWELRY_DEFAULT_PRODUCT_TYPE,
] as const;

export const FOOD_PRODUCT_TYPES = [
  "غذای آماده",
  "نوشیدنی",
  "دسر",
  "آیتم کافه",
  "بشقاب رستورانی",
  "غذا یا نوشیدنی بسته‌بندی‌شده",
  FOOD_DEFAULT_PRODUCT_TYPE,
] as const;

export const PRODUCT_TYPES_BY_VERTICAL = {
  jewelry: JEWELRY_PRODUCT_TYPES,
  food: FOOD_PRODUCT_TYPES,
  clothing: [JEWELRY_DEFAULT_PRODUCT_TYPE],
  furniture: [JEWELRY_DEFAULT_PRODUCT_TYPE],
} as const satisfies Record<VerticalId, readonly string[]>;

export const PRODUCT_TYPES = JEWELRY_PRODUCT_TYPES;

export type ProductType = (typeof JEWELRY_PRODUCT_TYPES)[number] | (typeof FOOD_PRODUCT_TYPES)[number];

export function getProductTypes(vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  return PRODUCT_TYPES_BY_VERTICAL[vertical] ?? JEWELRY_PRODUCT_TYPES;
}

export function getDefaultProductType(vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  return vertical === "food" ? FOOD_DEFAULT_PRODUCT_TYPE : JEWELRY_DEFAULT_PRODUCT_TYPE;
}

export function isProductType(value: string, vertical: VerticalId = DEFAULT_VERTICAL_ID): value is ProductType {
  return (getProductTypes(vertical) as readonly string[]).includes(value);
}

export function normalizeProductType(value: unknown, vertical: VerticalId = DEFAULT_VERTICAL_ID): ProductType {
  const text = typeof value === "string" ? value.trim() : "";
  return isProductType(text, vertical) ? text : getDefaultProductType(vertical);
}

export function productTypeLabel(value: ProductType, vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  if (value === getDefaultProductType(vertical)) {
    return "سایر";
  }

  return value;
}
